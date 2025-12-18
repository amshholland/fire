import util from 'node:util';
export const prettyPrint = (obj: unknown) => {
  console.log(util.inspect(obj, { colors: true, depth: 4 }));
};