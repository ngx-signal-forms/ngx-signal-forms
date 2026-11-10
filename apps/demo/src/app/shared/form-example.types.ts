/**
 * Configuration for the educational cards
 */
export type ExampleCardConfig = {
  demonstrated: {
    icon: string;
    title: string;
    sections: {
      title: string;
      items: string[];
    }[];
  };
  learning: {
    title: string;
    sections: {
      title: string;
      items: string[];
    }[];
    nextStep: {
      text: string;
      link: string;
      linkText: string;
    };
  };
};
