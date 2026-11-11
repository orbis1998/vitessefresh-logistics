import type { SVGProps } from "react";

export type VitaIconProps = SVGProps<SVGSVGElement>;

const Icon = ({ children, ...props }: VitaIconProps) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const VitaExpressIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M5 11.5 16 5l11 6.5v9L16 27 5 20.5z" />
    <path d="m5 11.5 11 6.4 11-6.4M16 17.9V27M10.5 8.3l11 6.4" />
    <path d="M2.5 17h6M4.5 21h5" />
  </Icon>
);

export const VitaPriorityIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M11 8.5 20 5l7 5.5-3 10-9 5.5-7-5.5z" />
    <path d="m11 8.5 8 5 8-3M19 13.5 15 26" />
    <path d="M2.5 11h6M4.5 15h5M2.5 19h5" />
  </Icon>
);

export const VitaCheckIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="m8 16.5 5 5L24.5 10" />
    <path d="M26.5 16A10.5 10.5 0 1 1 16 5.5" opacity=".45" />
  </Icon>
);

export const VitaArrowIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M5 16h20M18.5 9.5 25 16l-6.5 6.5" />
  </Icon>
);

export const VitaSupportIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M6 18v-3a10 10 0 0 1 20 0v3" />
    <path d="M6 17h3.5v7H8a2 2 0 0 1-2-2zM26 17h-3.5v7H24a2 2 0 0 0 2-2z" />
    <path d="M22.5 24c-1 2-3 3-6 3h-2" />
  </Icon>
);

export const VitaPinIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M25 13c0 7-9 14-9 14S7 20 7 13a9 9 0 1 1 18 0Z" />
    <circle cx="16" cy="13" r="3" />
  </Icon>
);

export const VitaParcelIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="m5 10 11-6 11 6v12L16 28 5 22z" />
    <path d="m5 10 11 6 11-6M16 16v12M10.5 7l11 6" />
  </Icon>
);

export const VitaPhoneIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <rect x="9" y="3.5" width="14" height="25" rx="3" />
    <path d="M13 7h6M14.5 25h3" />
  </Icon>
);

export const VitaUserIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <circle cx="16" cy="11" r="5" />
    <path d="M6.5 27c.7-5.4 4-8 9.5-8s8.8 2.6 9.5 8" />
  </Icon>
);

export const VitaShieldIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M16 3.5 26 8v7.5c0 6-4 10-10 13-6-3-10-7-10-13V8z" />
    <path d="m11.5 16 3 3 6-7" />
  </Icon>
);

export const VitaCalculatorIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <rect x="7" y="3.5" width="18" height="25" rx="2.5" />
    <path d="M11 8h10v5H11zM11 18h.1M16 18h.1M21 18h.1M11 23h.1M16 23h.1M21 23h.1" />
  </Icon>
);

export const VitaCashIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="8" width="25" height="16" rx="2" />
    <circle cx="16" cy="16" r="4" />
    <path d="M8 12H6.5v2M24 20h1.5v-2" />
  </Icon>
);

export const VitaMenuIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M5 9h22M5 16h22M5 23h22" />
  </Icon>
);

export const VitaCloseIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="m8 8 16 16M24 8 8 24" />
  </Icon>
);

export const VitaLocateIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <circle cx="16" cy="16" r="7" />
    <circle cx="16" cy="16" r="2.5" />
    <path d="M16 3v4M16 25v4M3 16h4M25 16h4" />
  </Icon>
);

export const VitaLoaderIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M27 16A11 11 0 1 1 16 5" opacity=".35" />
    <path d="M16 5a11 11 0 0 1 7.8 3.2" />
  </Icon>
);

export const VitaMailIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="7" width="25" height="18" rx="2.5" />
    <path d="m5 9 11 8 11-8" />
  </Icon>
);

export const VitaChatIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M5 6.5h22v16H14l-6.5 4v-4H5z" />
    <path d="M10 14.5h.1M16 14.5h.1M22 14.5h.1" />
  </Icon>
);

export const VitaClockIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <circle cx="16" cy="16" r="12" />
    <path d="M16 9v7l5 3" />
  </Icon>
);

export const VitaBuildingIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M6 28V7l13-3v24M19 11h7v17M10 10h4M10 15h4M10 20h4M22 15h1M22 20h1M3 28h26" />
  </Icon>
);

export const VitaTeamIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="11" r="4" />
    <circle cx="23" cy="13" r="3" />
    <path d="M4.5 27c.5-5 3-8 7.5-8s7 3 7.5 8M20 20c4.5-.4 7 2 7.5 6" />
  </Icon>
);

export const VitaSendIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="m4 5 24 11L4 27l3-9 13-2L7 14z" />
  </Icon>
);

export const VitaSearchIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <circle cx="14" cy="14" r="9" />
    <path d="m21 21 7 7" />
  </Icon>
);

export const VitaEyeIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M3.5 16s4.5-8 12.5-8 12.5 8 12.5 8-4.5 8-12.5 8S3.5 16 3.5 16Z" />
    <circle cx="16" cy="16" r="3.5" />
  </Icon>
);

export const VitaEyeOffIcon = (props: VitaIconProps) => (
  <Icon {...props}>
    <path d="M6 6 26 26M11 9a12 12 0 0 1 5-1c8 0 12.5 8 12.5 8a20 20 0 0 1-4 5M19.5 23.5A12 12 0 0 1 16 24C8 24 3.5 16 3.5 16a20 20 0 0 1 4-5" />
    <path d="M13.5 13.5a3.5 3.5 0 0 0 5 5" />
  </Icon>
);
