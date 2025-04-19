const modules = import.meta.glob('./homepage/profile-pictures/**', {eager: true});
export const profilePictures = Object.values(modules).map((module) => (module as {default: string}).default);

export {default as icon} from './logo/icon.svg';
export {default as logo} from './logo/logo-white-text.svg';
export {default as logoBesideText} from './logo/logo-beside-text.svg';

export {default as cart} from './empty-states/cart.svg';
export {default as lock} from './empty-states/lock.svg';
export {default as file} from './empty-states/file.svg';
export {default as group} from './empty-states/group.svg';
export {default as pencil} from './empty-states/pencil.svg';
export {default as mailbox} from './empty-states/mailbox.svg';
export {default as shredder} from './empty-states/shredder.svg';
export {default as conversation} from './empty-states/conversation.svg';

export {default as canvas} from './extensions/canvas.svg';
export {default as ublock} from './extensions/ublock.svg';
export {default as screenshot} from './extensions/screenshot.webp';

export {default as github} from './links/github.svg';
export {default as discord} from './links/discord.svg';
export {default as website} from './links/website.svg';
export {default as mastodon} from './links/mastodon.svg';
export {default as systemDesign} from './system-design.webp';

export {default as circuitPattern} from './patterns/circuit-pattern.svg';
export {default as worldMap} from './patterns/world-map.svg';

export {default as registration} from './homepage/usecases/registration.svg';
export {default as management} from './homepage/usecases/management.svg';
export {default as background} from './homepage/background.webp';
export {default as dashboard} from './homepage/dashboard.webp';

export {default as cog} from './homepage/features/cog.svg';
export {default as tag} from './homepage/features/tag.svg';
export {default as shield} from './homepage/features/shield.svg';
export {default as support} from './homepage/features/support.svg';
export {default as handTap} from './homepage/features/hand-tap.svg';
export {default as customer} from './homepage/features/customer.svg';
export {default as terminal} from './homepage/features/terminal.svg';
export {default as openSource} from './homepage/features/open-source.svg';

export {default as card} from './homepage/services/card.webp';
export {default as cloud} from './homepage/services/cloud.webp';
export {default as email} from './homepage/services/email.webp';
export {default as globe} from './homepage/services/globe.webp';
export {default as money} from './homepage/services/money.webp';
export {default as tower} from './homepage/services/tower.webp';
export {default as router} from './homepage/services/router.webp';
export {default as server} from './homepage/services/server.webp';
export {default as message} from './homepage/services/message.webp';
export {default as identity} from './homepage/services/identity.webp';
