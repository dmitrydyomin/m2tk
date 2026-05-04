import getopts from 'getopts';

const options = getopts(process.argv.slice(2), {
  alias: {
    inserts: 'i',
    output: ['o', 'f'],
    type: 't',
  },
  boolean: ['i'],
});

export const config = {
  boolean: !!options.boolean,
  constructor: !options.noConstructor,
  inserts: options.inserts,
  otherSchemas: options.otherSchemas,
  prefix: options.prefix || '',
};
