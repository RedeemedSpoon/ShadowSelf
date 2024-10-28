import type {Notification, AnimationNode, AnimationSelector} from '$types';
import {notification, pricingModel} from '$store';
import {allPricingModel} from '$types';
import {goto} from '$app/navigation';
import {get} from 'svelte/store';
import {scrollY} from '$store';

export function changePricingModel(model: string) {
  // @ts-expect-error ts(2322): Some svelte bug prevent type assertion smh
  pricingModel.set({name: model, ...allPricingModel[model.toLowerCase()]});
  const margin = model === 'Monthly' ? '0%' : model === 'Annually' ? '33%' : '66%';
  const element = document.querySelector('#select-model-box') as HTMLElement;
  element.style.left = margin;
}

export function notify(message: Notification['message'], type: Notification['type'] = 'info') {
  const id = Math.floor(Math.random() * 10000);
  notification.set({message, type, id});
  setTimeout(() => {
    if (get(notification).id === id) {
      notification.set({id: null, message: '', type: 'info'});
    }
  }, 5000);
}

export async function fetchApi(url: string, method = 'GET', body?: Record<string, unknown>) {
  return await fetch('http://localhost:3000/api' + url, {
    method,
    headers: {'Content-Type': 'application/json'},
    body: body ? JSON.stringify(body) : undefined,
  })
    .then((res) => res.json())
    .catch(() => ({message: 'An error occurred. Please try again later.', type: 'alert'}));
}

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
  const nodes = elements.map((element) => {
    const query = document.querySelectorAll(element.selector) as NodeListOf<HTMLElement>;
    const object: AnimationNode[] = [];

    query.forEach((node, key) => {
      const translate =
        element.type === 'left' ? '-translate-x-24' : element.type === 'right' ? 'translate-x-24' : 'translate-y-24';

      node.classList.add('transition-all', '!duration-1000', 'ease-in-out', 'opacity-0', translate);
      object.push({
        node: node,
        delay: element.delay || 125 * key,
        type: element.type,
      });
    });

    return object;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = animatedNodes.find((node) => node.node === entry.target);
        const translate = entry.target.classList[entry.target.classList.length - 1];
        setTimeout(() => {
          if (translate.includes('translate')) entry.target.classList.remove(translate);
          entry.target.classList.remove('opacity-0');
        }, target?.delay);
      }
    });
  });

  const animatedNodes = nodes.flat(1);
  animatedNodes.forEach((node) => observer.observe(node.node));
  return () => observer.disconnect();
}
