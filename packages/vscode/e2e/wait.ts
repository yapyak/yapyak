const POLL_MILLISECONDS = 100;
const WAIT_MILLISECONDS = 15_000;

export async function waitFor<T>(
  read: () => T | PromiseLike<T>,
  accept: (value: T) => boolean,
): Promise<T> {
  const deadline = Date.now() + WAIT_MILLISECONDS;
  let value = await read();
  while (!accept(value)) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out after ${WAIT_MILLISECONDS}ms.`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MILLISECONDS));
    value = await read();
  }
  return value;
}
