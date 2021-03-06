import { InteractiveProps } from "../../../../actions/interactive"
import { SlackBody } from "../../../../models/platform/slack/body"
import { getSlackButtonAction } from "./button-props"
import { getSlackThanksConfirmationProps } from "./thanks-props"
import { getSlackCheckboxAction } from "./checkbox-action-props"

interface Action {
  getProps: (body: SlackBody) => any
  accept: boolean
}

interface Dictionary<T> {
  [key: string]: T
}

const buttonMapper = {
  getProps: getSlackButtonAction,
  accept: true,
}

export const getSlackInteractiveProps = async (body: SlackBody): Promise<InteractiveProps> => {
  const mapper: Dictionary<Action> = {
    // TODO: Pendiente refactor
    ["thanks-confirmation"]: {
      getProps: getSlackThanksConfirmationProps,
      accept: body.payload.type === "view_submission",
    },
    ["accept-coffee"]: buttonMapper,
    ["reject-coffee"]: buttonMapper,
    ["try-again-coffee"]: buttonMapper,
    ["stop-coffee"]: buttonMapper,
    ["complete-todo"]: {
      getProps: getSlackCheckboxAction,
      accept: true,
    },
  }

  let actionId = ""
  if (body.payload?.view) {
    const externalId = body.payload.view.external_id.replace(/^[0-9]+-/, "")
    actionId = externalId
  } else if (body.payload?.actions) {
    actionId = body.payload.actions[0].action_id
  }
  const action = mapper[actionId]

  return {
    nextStep: actionId,
    accept: action?.accept ?? false,
    data: action?.accept ? action.getProps(body) : {},
  }
}
