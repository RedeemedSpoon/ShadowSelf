import type {AnimationNode, AnimationSelector} from '$type';
import {goto} from '$app/navigation';
import {get} from 'svelte/store';
import {scrollY} from '$store';

export function addTabScrollEvent(sectionsIds: string[]) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      let currentSection = Math.ceil((get(scrollY) + 10) / window.innerHeight);
      if ((currentSection === 1 && e.shiftKey) || (currentSection === sectionsIds.length && !e.shiftKey)) {
        goto(`#${sectionsIds[0]}`);
        return;
      }

      currentSection = e.shiftKey ? currentSection - 2 : currentSection;
      goto(`#${sectionsIds[currentSection]}`);
    }
  });
}

export function addAnimation(elements: AnimationSelector[]) {
  function returnTranslate(type: AnimationNode['type']) {
    if (window.innerWidth < 1269 || type === 'bottom') return '!translate-y-24';
    return type === 'left' ? 'sm:!-translate-x-24' : 'sm:!translate-x-24';
  }

  const nodes = elements.map((element) => {
    const query = document.querySelectorAll(element.selector) as NodeListOf<HTMLElement>;
    const object: AnimationNode[] = [];

    query.forEach((node, key) => {
      const translate = returnTranslate(element.type);

      node.classList.add('transition-all', '!duration-1000', 'ease-in-out', 'opacity-0', translate);
      object.push({
        node: node,
        delay: element.delay || 100 * key,
        type: element.type,
      });
    });

    return object;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const target = animatedNodes.find((node) => node.node === entry.target) as AnimationNode;
      const translate = returnTranslate(target?.type);

      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('!duration-1000');
          entry.target.classList.remove('opacity-0', translate);
        }, target?.delay);
      } else {
        entry.target.classList.remove('!duration-1000');
        entry.target.classList.add('opacity-0', translate);
      }
    });
  });

  const animatedNodes = nodes.flat(1);
  animatedNodes.forEach((node) => observer.observe(node.node));
  return () => observer.disconnect();
}
