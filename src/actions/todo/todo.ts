import { Platform } from "../../services/platform/platform"
import { Database } from "../../services/database/database"
import { ToDo } from "../../models/database/todo"
import { Id } from "../../models/platform/slack/id"
import { I18n } from "../../services/i18n/i18n"
import { Factory } from "../../services/infrastructure/factory";

export interface TodoProps {
  userId: string,
  text: string
}

const idRegExp = "(?<id>[UW][A-Z0-9]+)"
const usernameRegExp = "([a-z0-9._-]{1,21})"

export const todo = async (platform: Platform, data: TodoProps, db: Database = Factory.createRepository()) => {
  const listKeyword = /^list$/
  const userKeyword = new RegExp(`<@${idRegExp}[|]${usernameRegExp}> `)
  const userMentioned = data.text.match(userKeyword)
  if (data.text.match(listKeyword)) {
    await listToDos(platform, data, db)
  } else if (userMentioned && userMentioned.groups?.id) {
    data.text = data.text.replace(userMentioned[0], "")
    await assignToDo(platform, data, db, userMentioned.groups.id)
  } else {
    await createToDo(platform, data, db)
  }
}

const listToDos = async (platform: Platform, data: TodoProps, db: Database) => {
  const toDoList: ToDo[] = await db.getToDos(data.userId)
  await platform.sendMessage(data.userId, await platform.getView("toDoList", { userId: data.userId, toDoList }))
}

const createToDo = async (platform: Platform, data: TodoProps, db: Database) => {
  const i18n: I18n = await I18n.getInstance()
  if (data.text.length === 0) {
    await platform.sendMessage(data.userId, await i18n.translate("todo.emptyTextError", { todo: data.text }))
    return
  }
  if (!await getUserTodoAvailability(data.userId, db)) {
    await platform.sendMessage(data.userId, await i18n.translate("todo.fullUserToDoList"))
    return
  }
  const todo: ToDo = new ToDo(new Id(data.userId), data.text)
  await db.saveToDo(todo)
  await platform.sendMessage(data.userId, await i18n.translate("todo.toDoCreated", { todo: data.text }))
}

const assignToDo = async (platform: Platform, data: TodoProps, db: Database, assigneeId: string) => {
  const i18n: I18n = await I18n.getInstance()
  if (!await getUserTodoAvailability(assigneeId, db)) {
    await platform.sendMessage(data.userId, await i18n.translate("todo.fullAssigneeToDoList", { user: `<@${assigneeId}>` }))
    return
  }
  const todo: ToDo = new ToDo(new Id(data.userId), data.text, new Id(assigneeId))
  await db.saveToDo(todo)
  await platform.sendMessage(data.userId, await i18n.translate("todo.toDoCreated", { todo: data.text }))
  await platform.sendMessage(assigneeId, await i18n.translate("todo.toDoAssigned", { todo: data.text, user: `<@${data.userId}>` }))
}

const getUserTodoAvailability = async (userId: string, db: Database): Promise<boolean> => {
  const userToDos = await db.getToDos(userId)
  const userToDoCount = userToDos.filter((todo) => !todo.completed).length
  const maxToDos = 10
  return userToDoCount < maxToDos
}
