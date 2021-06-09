import getopts from 'getopts';

const options = getopts(process.argv.slice(2), {
  alias: {
    output: ['o', 'f'],
    type: 't',
  },
});

export const config = {
  boolean: !!options.boolean,
  prefix: options.prefix || '',
};
