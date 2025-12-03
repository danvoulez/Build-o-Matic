// ...existing imports and code...
// Replace the deploy target input rendering block with extended options:

{currentQuestion.type === 'single' && currentQuestion.id === 'deployTarget' && (
  <div className="space-y-2">
    {[
      'railway',
      'render',
      'docker',
      'aws-eb',
      'aws-ecs',
      'gcp-cloudrun'
    ].map((opt) => (
      <label key={opt} className="flex gap-2 items-center">
        <input
          type="radio"
          name={currentQuestion.id}
          checked={answers[currentQuestion.id] === opt}
          onChange={() => setAnswer(opt)}
        />
        <span className="capitalize">{opt.replace('-', ' ')}</span>
      </label>
    ))}
  </div>
)}