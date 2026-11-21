import type { ReactNode, SVGProps } from 'react';

function Icon({ children, size = 22 }: { children: ReactNode; size?: number }) {
  const props: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  return <svg {...props}>{children}</svg>;
}

export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const BackIcon = () => (
  <Icon>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);
export const TrashIcon = () => (
  <Icon size={20}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);
export const LogoutIcon = () => (
  <Icon size={20}>
    <path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3" />
  </Icon>
);
export const PhoneIcon = () => (
  <Icon size={18}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </Icon>
);
export const PinIcon = () => (
  <Icon size={18}>
    <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </Icon>
);
export const MapIcon = () => (
  <Icon size={20}>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
  </Icon>
);

/* Section icons */
export const AlertIcon = () => (
  <Icon>
    <path d="M12 3l10 18H2L12 3z" />
    <path d="M12 10v4M12 17.5v.5" />
  </Icon>
);
export const ContactIcon = () => <PhoneIcon />;
export const ShelterIcon = () => (
  <Icon>
    <path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5" />
  </Icon>
);
export const NgoIcon = () => (
  <Icon>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Icon>
);
export const AdminsIcon = () => (
  <Icon>
    <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

/* Disaster types */
export const FloodIcon = () => (
  <Icon size={20}>
    <path d="M2 16c2 0 2-1.5 4-1.5S8 16 10 16s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 20c2 0 2-1.5 4-1.5S8 20 10 20s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M12 3l-4 6h8l-4-6z" />
  </Icon>
);
export const LandslideIcon = () => (
  <Icon size={20}>
    <path d="M3 20h18L13 6l-3 5-2-2-5 11z" />
    <circle cx="17" cy="9" r="1" />
    <circle cx="19.5" cy="12.5" r="1" />
  </Icon>
);
export const QuakeIcon = () => (
  <Icon size={20}>
    <path d="M2 12h4l2-6 3 12 3-9 2 5 2-2h4" />
  </Icon>
);
export const OtherIcon = () => (
  <Icon size={20}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.5" />
  </Icon>
);

export const DISASTER_ICONS = {
  flood: FloodIcon,
  landslide: LandslideIcon,
  earthquake: QuakeIcon,
  other: OtherIcon,
} as const;
