const header = 'estates: '

export function error(message) {
  throw Error(header + message)
}

//

export const addU = (x, y) => x + y

export const not = x => !x

export const ignore = _ => {}

//

export const isInstanceOf = Class => x => x instanceof Class
