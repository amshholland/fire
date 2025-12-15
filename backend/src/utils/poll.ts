export const pollWithRetries = <T>(
  requestCallback: () => Promise<T>,
  ms = 1000,
  retriesLeft = 20
): Promise<T> =>
  new Promise((resolve, reject) => {
    requestCallback()
      .then(resolve)
      .catch(() => {
        setTimeout(() => {
          if (retriesLeft === 1) {
            reject(new Error('Ran out of retries while polling'));
            return;
          }
          pollWithRetries(requestCallback, ms, retriesLeft - 1).then(resolve).catch(reject);
        }, ms);
      });
  });