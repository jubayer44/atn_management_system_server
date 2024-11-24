const pickFunction = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
) => {
  const picked: Partial<T> = {};
  keys.forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      picked[key] = obj[key];
    }
  });
  return picked;
};

export default pickFunction;

export const pickFunctionArray = <
  T extends Record<string, unknown>,
  K extends keyof T
>(
  obj: T[],
  keys: K[]
) => {
  return obj.map((item) => {
    const picked: Partial<T> = {};
    keys.forEach((key) => {
      if (item.hasOwnProperty(key)) {
        picked[key] = item[key];
      }
    });
    return picked;
  });
};

// const pickFunction = <T extends Record<string, unknown>, K extends keyof T>(
//   obj: T | T[],
//   keys: K[]
// ) => {
// if (Array.isArray(obj)) {
//   return obj.map((item) => {
//     const picked: Partial<T> = {};
//     keys.forEach((key) => {
//       if (item.hasOwnProperty(key)) {
//         picked[key] = item[key];
//       }
//     });
//     return picked;
//   });
// } else {
//     const picked: Partial<T> = {};
//     keys.forEach((key) => {
//       if (obj.hasOwnProperty(key)) {
//         picked[key] = obj[key];
//       }
//     });
//     return picked;
//   }
// };

// export default pickFunction;
