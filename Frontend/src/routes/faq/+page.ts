import type {PageLoad} from './$types';

export const load: PageLoad = () => {
  return {
    faqs: [
      {
        question: 'What is Shadow Self?',
        answer:
          'Shadow Self is a web application that allows users to create and manage their own personal finances. It is built using the PowerBI API and the OpenAI API.',
      },
      {
        question: 'How does Shadow Self work?',
        answer:
          'Shadow Self allows users to create and manage their own personal finances. It is built using the PowerBI API and the OpenAI API.',
      },
      {
        question: 'How do I use Shadow Self?',
        answer:
          'Shadow Self allows users to create and manage their own personal finances. It is built using the PowerBI API and the OpenAI API.',
      },
    ],
  } satisfies {faqs: {question: string; answer: string}[]};
};
