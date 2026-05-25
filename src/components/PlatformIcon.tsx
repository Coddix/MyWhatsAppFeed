import {
  FaYoutube,
  FaXTwitter,
  FaInstagram,
  FaTiktok,
  FaFacebook,
  FaLinkedin,
  FaReddit,
  FaSpotify,
  FaGithub,
  FaWhatsapp,
  FaLink,
} from "react-icons/fa6";
import type { Platform } from "@/lib/link-utils";

const ICONS: Record<Platform, { Icon: typeof FaYoutube; color: string }> = {
  youtube: { Icon: FaYoutube, color: "text-red-600" },
  twitter: { Icon: FaXTwitter, color: "text-black dark:text-white" },
  instagram: { Icon: FaInstagram, color: "text-pink-600" },
  tiktok: { Icon: FaTiktok, color: "text-black dark:text-white" },
  facebook: { Icon: FaFacebook, color: "text-blue-600" },
  linkedin: { Icon: FaLinkedin, color: "text-blue-700" },
  reddit: { Icon: FaReddit, color: "text-orange-600" },
  spotify: { Icon: FaSpotify, color: "text-green-600" },
  github: { Icon: FaGithub, color: "text-gray-800 dark:text-gray-200" },
  whatsapp: { Icon: FaWhatsapp, color: "text-green-500" },
};

export function PlatformIcon({ platform, size = 16 }: { platform: Platform | null; size?: number }) {
  if (!platform) return <FaLink size={size} className="text-gray-400" />;
  const { Icon, color } = ICONS[platform];
  return <Icon size={size} className={color} />;
}
