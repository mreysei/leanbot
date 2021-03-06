import { CoffeeBreakBuilder } from "../../../tests/builders/models/coffee-break-builder"
import { CoffeeBreak } from "../../../models/database/coffee-break"
import { CommunityBuilder } from "../../../tests/builders/models/community-builder"
import { GratitudeMessageBuilder } from "../../../tests/builders/models/gratitude-message-builder"
import { Community } from "../../../models/database/community"
import { config } from "../../../config"
import { MongoDB } from "./mongo"
import { GratitudeMessage } from "../../../models/database/gratitude-message"
import { ToDo } from "../../../models/database/todo"
import { ToDoBuilder } from "../../../tests/builders/models/to-do-builder"
import { Id } from "../../../models/platform/slack/id"

describe("Service MongoDB: ", () => {
  let db: MongoDB
  const oldConfig = config.database

  beforeEach(() => {
    config.database = {
      mongodb: {
        uri: process.env.TEST_MONGODB_URI || "",
        database: process.env.TEST_MONGODB_DATABASE || "test",
      },
    }
    db = new MongoDB()
  })

  afterEach(async () => {
    await db.removeCollections()
  })

  afterAll(() => {
    config.database = oldConfig
  })

  it("should throw errors if needed", async () => {
    config.database = {
      mongodb: {
        uri: "",
        database: "test",
      },
    }

    const errorDb = new MongoDB()
    await expect(errorDb.getCommunities()).rejects.toBeDefined()
  })

  describe("Collection communities", () => {
    it("should save and retrieve communities", async () => {
      const communities: Community[] = [
        CommunityBuilder({ id: "first-community-id" }),
        CommunityBuilder({ id: "second-community-id" }),
      ]
      await db.registerCommunity(communities[0])
      await db.registerCommunity(communities[1])

      const retrievedCommunities: Community[] = await db.getCommunities()

      expect(retrievedCommunities).toContainEqual(communities[0])
      expect(retrievedCommunities).toContainEqual(communities[1])
      expect(retrievedCommunities).toHaveLength(2)
    })
  })

  describe("Collection gratitude messages:", () => {
    it("should save and retrieve gratitude messages", async () => {
      const gratitudeMessages: GratitudeMessage[] = [
        GratitudeMessageBuilder({ text: "message 1" }),
        GratitudeMessageBuilder({ text: "message 2" }),
        GratitudeMessageBuilder({ text: "message 3" }),
      ]
      await db.saveGratitudeMessages(gratitudeMessages)

      const retrievedMessages: GratitudeMessage[] = await db.getGratitudeMessages({})

      expect(retrievedMessages).toContainEqual(gratitudeMessages[0])
      expect(retrievedMessages).toContainEqual(gratitudeMessages[1])
      expect(retrievedMessages).toContainEqual(gratitudeMessages[2])
      expect(retrievedMessages).toHaveLength(3)
    })

    it("should retrieve gratitude messages from a given number of days", async () => {
      const today = new Date()
      const fiveDaysAgo = new Date()
      fiveDaysAgo.setDate(today.getDate() - 5)

      const gratitudeMessages: GratitudeMessage[] = [
        GratitudeMessageBuilder({ createdAt: today }),
        GratitudeMessageBuilder({ createdAt: fiveDaysAgo }),
      ]
      await db.saveGratitudeMessages(gratitudeMessages)

      const retrievedMessages: GratitudeMessage[] = await db.getGratitudeMessages({ days: 3 })

      expect(retrievedMessages).toContainEqual(gratitudeMessages[0])
      expect(retrievedMessages).not.toContainEqual(gratitudeMessages[1])
      expect(retrievedMessages).toHaveLength(1)
    })
  })

  describe("Collection coffee breaks:", () => {
    it("should save coffee breaks", async () => {
      const coffeeBreak: CoffeeBreak = CoffeeBreakBuilder({})
      await db.saveCoffeeBreak(coffeeBreak)
    })
  })

  describe('Collection to dos:', () => {
    it('should save and retrieve to dos', async () => {
      const userId = "test-user-id"
      const toDo: ToDo = ToDoBuilder({ user: new Id(userId) })
      await db.saveToDo(toDo)

      const retrievedToDos: ToDo[] = await db.getToDos(userId)

      expect(retrievedToDos).toHaveLength(1)
      expect(retrievedToDos[0].user).toEqual(toDo.user)
      expect(retrievedToDos[0].text).toEqual(toDo.text)
    })
  })
})
