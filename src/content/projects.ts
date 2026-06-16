export interface Project {
  title: string
  description: string
  href: string
  tags: string[]
}

export const projects: Project[] = [
  {
    title: 'forumless',
    description:
      'A headless forum engine in Go — backend-only, API-driven, bring your own frontend.',
    href: 'https://github.com/fess932/forumless',
    tags: ['Go', 'API'],
  },
  {
    title: 'hsng',
    description:
      'Headless social network built over GraphQL in Go. An experiment in modeling a social graph behind a clean API.',
    href: 'https://github.com/fess932/hsng',
    tags: ['Go', 'GraphQL'],
  },
  {
    title: 'tcpconn',
    description:
      'A userspace TCP stack in Go — implementing TCP from scratch on top of raw packets to understand the protocol end to end.',
    href: 'https://github.com/fess932/tcpconn',
    tags: ['Go', 'Networking'],
  },
  {
    title: 'rchat',
    description:
      'A VoIP application written in Rust — real-time voice chat, exploring audio transport and low-latency networking.',
    href: 'https://github.com/fess932/rchat',
    tags: ['Rust', 'VoIP'],
  },
  {
    title: 'media_server',
    description: 'A media server written in Rust, focused on streaming and serving media efficiently.',
    href: 'https://github.com/fess932/media_server',
    tags: ['Rust', 'Media'],
  },
  {
    title: 'govps',
    description: 'A simple libvirt UI in Go — manage VMs without the heavyweight dashboards.',
    href: 'https://github.com/fess932/govps',
    tags: ['Go', 'libvirt'],
  },
  {
    title: 'qemu-exporter',
    description:
      'A QEMU Prometheus exporter library — collect VM metrics directly, without depending on libvirt.',
    href: 'https://github.com/fess932/qemu-exporter',
    tags: ['Go', 'Prometheus'],
  },
  {
    title: 'telehaptic',
    description:
      'A Telegram trigger for MX Master haptic feedback — a small bridge between Telegram events and hardware.',
    href: 'https://github.com/fess932/telehaptic',
    tags: ['Go', 'Hardware'],
  },
]
