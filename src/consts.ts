// Global site data — imported anywhere via `import { ... } from '../consts'`.

export const SITE_TITLE = 'Feziv'
export const SITE_DESCRIPTION =
  'Notes and thoughts on backend, networks and systems — by Ivan Cheremisin.'
export const SITE_URL = 'https://me.feziv.ru'

export const AUTHOR = {
  name: 'Ivan Cheremisin',
  occupation: 'Software developer — backend (Go, some Rust)',
  bio: 'Backend developer who loves video games and rationality fiction. I build small systems-y things: forum engines, a userspace TCP stack, VoIP, virtualization tooling.',
  avatar: '/static/images/avatar2.png',
}

export const NAV_LINKS = [
  { href: '/', title: 'Home' },
  { href: '/blog', title: 'Blog' },
  { href: '/projects', title: 'Projects' },
  { href: '/tags', title: 'Tags' },
  { href: '/about', title: 'About' },
]

// Only real links — rendered in header/footer.
export const SOCIALS = {
  email: 'fess932@gmail.com',
  github: 'https://github.com/fess932',
  telegram: 'https://t.me/fess932',
  mastodon: 'https://mastodon.social/@fess932',
  twitter: 'https://twitter.com/fess932',
}
