import { I18n } from './../../services/i18n/i18n';
import { CoffeeButtonActionProps } from '../../services/platform/slack/props/button-props';
import { Platform } from './../../services/platform/platform';

export const acceptCoffee = async (platform: Platform, data: CoffeeButtonActionProps ) => {
  const i18n = await I18n.getInstance()

  platform.updateMessage(data.responseUrl, i18n.translate("coffeeRoulette.recipientAcceptedOffer", { sender: `<@${data.sender}>`}) )
  platform.sendMessage(data.sender, i18n.translate("coffeeRoulette.acceptedOffer", { user: `<@${data.userId}>`}) )
}