/**
 * Optional local Docker build runner using child_process for demo purposes.
 * Requires Docker installed locally.
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
export async function runDockerBuild(artifact, outDir = './generated') {
    await fs.promises.mkdir(outDir, { recursive: true });
    const tarPath = `${outDir}/package.tar.gz`;
    await fs.promises.writeFile(tarPath, artifact);
    // Extract tar.gz into outDir
    await extractTarGz(tarPath, outDir);
    // Run docker build
    await execCommand('docker', ['build', '-t', 'buildomatic-tool', '.'], { cwd: outDir });
    // Run docker
    await execCommand('docker', ['run', '-d', '-p', '3000:3000', '--name', 'buildomatic-tool', 'buildomatic-tool'], { cwd: outDir });
    return { ok: true, message: 'Docker container running on port 3000' };
}
function execCommand(cmd, args, opts = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
        child.on('exit', (code) => {
            if (code === 0)
                resolve();
            else
                reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
        });
    });
}
async function extractTarGz(tarPath, outDir) {
    // Minimal extraction using system tar
    await execCommand('tar', ['-xzf', tarPath, '-C', outDir]);
}
