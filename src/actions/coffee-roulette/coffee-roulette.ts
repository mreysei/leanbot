import { Logger } from './../../services/logger/logger';
import { I18n } from './../../services/i18n/i18n';
import { Platform } from "../../services/platform/platform";
import { SlackInteractiveBlock } from '../../models/platform/slack/views/views';

export interface CoffeeRouletteProps {
  channelId?: string,
  communityId: string,
  userId: string,
  text?: string
}

export const coffeeRoulette = async (platform: Platform, data: CoffeeRouletteProps): Promise<void> => {
  let communityMembers = platform.getTempUserData(data.userId, "coffeeMembers") 
  if (!communityMembers) {
    communityMembers = await platform.getCommunityMembers(data.communityId)
  }
  await coffeeRouletteRecursive(communityMembers)(platform, data)
}

const coffeeRouletteRecursive = (communityMembers: string[]) => async (platform: Platform, data: CoffeeRouletteProps): Promise<void> => {
  const i18n = await I18n.getInstance()
  if (communityMembers.length === 0) {
    platform.sendMessage(data.userId, i18n.translate("coffeeRoulette.noOneAvailable"))
    return 
  }
  const randomUserId = communityMembers[Math.floor(Math.random() * communityMembers.length)] 
  communityMembers.splice(communityMembers.indexOf(randomUserId), 1)
  const randomUserInfo = await platform.getUserInfo(randomUserId)
  if (randomUserInfo?.isBot || randomUserId === data.userId) {
    return coffeeRouletteRecursive(communityMembers)(platform, data)
  }

  platform.updateTempUserData(data.userId, "coffeeMembers", communityMembers)
  Logger.log(`/coffee-roulette: { user: ${data.userId}, invitedUser: ${randomUserId} } `)

  platform.sendMessage(data.userId, i18n.translate("coffeeRoulette.searching"))
  platform.sendMessage(randomUserId, await SlackInteractiveBlock.coffeeRouletteMessage(data))
}