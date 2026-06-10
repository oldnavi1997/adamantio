import { prisma } from "@/lib/prisma";
import {
  VIDEO_SPOTLIGHT_KEY,
  DEFAULT_VIDEO_SPOTLIGHT,
  parseSpotlightConfig,
  type SpotlightConfigItem,
} from "@/lib/video-spotlight";

/** Lee la configuración desde la DB; si no existe, devuelve la configuración por defecto. */
export async function getVideoSpotlightConfig(): Promise<SpotlightConfigItem[]> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: VIDEO_SPOTLIGHT_KEY },
  });
  return parseSpotlightConfig(setting?.value) ?? DEFAULT_VIDEO_SPOTLIGHT;
}
