import {argumentContext} from "../src/ArgumentContext";
import {checkSimilarity} from "../src/helpers";
import resetModules = jest.resetModules;
import {context as github} from "@actions/github";

const {testTodoChange} = require("./helpers")
require('dotenv').config();

jest.mock("../src/TodoHandler")
jest.mock("../src/GitHubContext")

const context = require("../src/GitHubContext")
const todoHandler = require("../src/TodoHandler")

let existingIssues = [];

describe("Add Test", () => {

    beforeEach(() => {
        resetModules()
        existingIssues = []
    })

    context.getIssues.mockImplementation(() => ({data: existingIssues}))

    const test = (file, expects = {}) => testTodoChange("add", file, expects);

    it("Adds One Todo", async () => {
        await test("Add", {addTodo: 1})
    })

    it("Adds Body", async () => {
        await test("AddBody")
    })

    it("Does not add BUG", async () => {
        await test("AddBUG")
    })

    it("Adds BUG", async () => {
        argumentContext.keywords = ['TODO', 'BUG']
        await test("AddBUG", {addTodo: 1})
    })

    it("Adds One TODO in HTML", async () => {

        todoHandler.addTodo.mockImplementationOnce(todo => {
            expect(todo.title.endsWith('-->')).toBeFalsy()
        })

        await test("AddInHtml", {addTodo: 1})
    })

    it("Adds Many Different", async () => {
        await test("AddMany", {addTodo: 5})
    })

    it("Adds TODO with similar title as existing", async () => {
        existingIssues.push({
            title: 'should we reinvent the gear here??',
            number: 2,
            state: "open"
        })

        todoHandler.addReferenceTodo.mockImplementationOnce(todo => {
            expect(todo.similarTodo.issueId).toBeCloseTo(2)
        })

        await test("AddSecond", {addReferenceTodo: 1})
    })

    it("Adds TODO with similar title as closed existing", async () => {
        existingIssues.push({
            title: 'should we reinvent the gear here??',
            number: 2,
            state: "closed"
        })

        todoHandler.addReferenceTodo.mockImplementationOnce(todo => {
            expect(todo.similarTodo.issueId).toBeCloseTo(2)
        })

        await test("AddSecond", {addReferenceTodo: 1, reopenTodo: 1})
    })

    it("Adds Three Same TODOs", async () => {
        await test("AddThreeSame", {addTodo: 1, addReferenceTodo: 2})
    })

    it("Adds Two similar TODOs", async () => {
        await test("AddTwoSimilar", {addTodo: 1, addReferenceTodo: 1})
    })

    it("Adds Two similar TODOs with existing", async () => {
        existingIssues.push({
            title: 'should we reinvent the gear here..',
            number: 3,
            state: "closed"
        })
        await test("AddTwoSimilar", {addReferenceTodo: 2, reopenTodo: 1})
    })

    it("Adds TODO with body", async () => {

        todoHandler.addTodo.mockImplementationOnce(todo => {
            expect(todo.bodyComment).toHaveLength(531)
        })

        await test("AddTodoWithBody", {addTodo: 1})
    })

    it("Adds two TODOs in two lines", async () => {
        await test("AddTwoInTwoLines", {addTodo: 2})
    })

    it("Add all", async () => {
        const added = []

        todoHandler.addTodo.mockImplementation(todo => {
            expect(added.find(value => checkSimilarity(value.title, todo.title))).toBeUndefined()
            added.push(todo)
        })

        todoHandler.addReferenceTodo.mockImplementation(todo => {
            expect(added.find(value => checkSimilarity(value.title, todo.title))).toBeDefined()
        })

        await test("All", {addTodo: false, addReferenceTodo: false})
    })
})