import { I18n } from "../../services/i18n/i18n"
import { Platform } from "../../services/platform/platform"
import { Database } from "../../services/database/database"
import { TodoPropsBuilder } from "../../tests/builders/actions/todo-props-builder"
import { todo, TodoProps } from "./todo"
import { Slack } from "../../services/platform/slack/slack"
import { ToDo } from "../../models/database/todo"
import { Id } from "../../models/platform/slack/id"

describe("To Do", () => {
  let i18n: I18n
  let platform: Platform
  let db: Database

  beforeEach(async () => {
    i18n = await I18n.getInstance()

    platform = Slack.getInstance()
    platform.sendMessage = jest.fn()

    db = Database.make()
    db.saveToDo = jest.fn()
  })

  describe("/todo", () => {
    it("should save todo", async () => {
      const userId = "test-user-id"
      const text = "my first todo"
      const props: TodoProps = TodoPropsBuilder({ userId, text })

      await todo(platform, props, db)

      expect(platform.sendMessage).toBeCalledWith(userId, i18n.translate("todo.toDoCreated", { todo: text }))
      expect(db.saveToDo).toBeCalled()
    })
    it.todo("should inform the user about usage if no todo text is provided")
  })
  describe("/todo list", () => {
    it("should show all uncompleted todos", async () => {
      const userId: Id = new Id("user-id")
      const toDoList = [new ToDo(userId, "todo 1"), new ToDo(userId, "todo 2"), new ToDo(userId, "todo 3")]
      db.getToDos = jest.fn(async (_) => toDoList)
      const text = "list"
      const props: TodoProps = TodoPropsBuilder({ userId: userId.id, text })

      await todo(platform, props, db)

      expect(db.getToDos).toBeCalledWith(userId.id)
      expect(platform.sendMessage).toBeCalledWith(userId.id, await platform.getView("toDoList", toDoList))
    })
  })
})
