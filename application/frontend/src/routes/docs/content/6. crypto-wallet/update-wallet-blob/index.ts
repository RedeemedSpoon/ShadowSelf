import DescriptionComponent from './description.svelte';

const modules = import.meta.glob('./*', {eager: true, as: 'raw'});

const filesData = {
  description: DescriptionComponent,
  response: JSON.parse(modules['./response.json']),
  code: {
    go: modules['./example.go'],
    javascript: modules['./example.js'],
    python: modules['./example.py'],
    rust: modules['./example.rs'],
    curl: modules['./example.sh'],
  },
};

export default filesData;
