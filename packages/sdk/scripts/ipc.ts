import { MockChain, paidAgent, QVACQualityVerifier, StubLLMJudge } from '../src/index.js';
import type { AgentAddress, Price } from '../src/types.js';

interface IpcPayload {
  price: string;
  stake: string;
  qualityThreshold: number;
  providerAddress: string;
  requesterAddress: string;
  input: Record<string, unknown>;
  resultText: string;
}

async function main(): Promise<void> {
  const raw = await new Promise<string>((resolve) => {
    let buf = '';
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => resolve(buf));
  });
  const payload = JSON.parse(raw) as IpcPayload;

  const chain = new MockChain();
  const provider = payload.providerAddress as AgentAddress;
  const requester = payload.requesterAddress as AgentAddress;
  chain.mintUsdt(requester, BigInt(payload.price) * 10n);
  chain.mintUsdt(provider, BigInt(payload.stake) * 10n);

  const judge = new QVACQualityVerifier(
    new StubLLMJudge({ matchScore: 0.9, failOn: 'BAD' })
  );

  const handle = paidAgent(
    {
      price: BigInt(payload.price) as Price,
      stake: BigInt(payload.stake) as Price,
      qualityThreshold: payload.qualityThreshold,
      deadlineMs: 60_000,
      providerAddress: provider,
      chain,
      judge
    },
    async () => payload.resultText
  );

  const out = await handle.call(requester, payload.input);
  process.stdout.write(JSON.stringify(out) + '\n');
}

main().catch((e) => {
  process.stderr.write(`ipc error: ${(e as Error).message}\n`);
  process.exit(1);
});
