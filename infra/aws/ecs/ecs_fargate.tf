# Minimal ECS Fargate stack (example)
provider "aws" {
  region = var.region
}

variable "region" {}
variable "cluster_name" {}
variable "subnets" { type = list(string) }
variable "security_groups" { type = list(string) }

resource "aws_ecs_cluster" "bom" {
  name = var.cluster_name
}

resource "aws_ecs_task_definition" "bom" {
  family                   = "bom-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  container_definitions    = <<DEFS
[
  {
    "name": "api",
    "image": "ghcr.io/owner/repo/buildomatic:latest",
    "portMappings": [{ "containerPort": 4000, "hostPort": 4000 }],
    "environment": [
      { "name": "NODE_ENV", "value": "production" },
      { "name": "DATABASE_URL", "value": "postgresql://user:pass@host:5432/db" }
    ]
  }
]
DEFS
}

resource "aws_ecs_service" "bom" {
  name            = "bom-service"
  cluster         = aws_ecs_cluster.bom.id
  task_definition = aws_ecs_task_definition.bom.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets         = var.subnets
    security_groups = var.security_groups
    assign_public_ip = true
  }
}