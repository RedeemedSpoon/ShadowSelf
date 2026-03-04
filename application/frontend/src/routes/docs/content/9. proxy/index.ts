const modules = import.meta.glob('./*', {eager: true, query: '?raw', import: 'default'});

const code = {
  go: modules['./example.go'],
  javascript: modules['./example.js'],
  python: modules['./example.py'],
  rust: modules['./example.rs'],
  curl: modules['./example.sh'],
};

export default code;
