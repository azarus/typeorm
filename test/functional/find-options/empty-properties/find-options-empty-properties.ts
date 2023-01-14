import "reflect-metadata"
import "../../../utils/test-setup"
import { DataSource, Equal } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("find options > where", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({ __dirname })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    async function prepareData(connection: DataSource) {
        const post1 = new Post()
        post1.title = "Post #1"
        post1.text = "About post #1"
        post1.type = "A"
        await connection.manager.save(post1)

        const post2 = new Post()
        post2.title = "Post #2"
        post2.text = "About post #2"
        post2.type = "B"
        await connection.manager.save(post2)
    }

    it("should skip undefined properties", () =>
        Promise.all(
            connections.map(async (connection) => {
                await prepareData(connection)

                const posts = await connection
                    .createQueryBuilder(Post, "post")
                    .setFindOptions({
                        where: {
                            title: "Post #1",
                            text: undefined,
                        },
                        order: {
                            id: "asc",
                        },
                    })
                    .getMany()

                posts.should.be.eql([
                    {
                        id: 1,
                        title: "Post #1",
                        text: "About post #1",
                        type: "A",
                    },
                ])
            }),
        ))

    it("should skip null properties", () =>
        Promise.all(
            connections.map(async (connection) => {
                await prepareData(connection)

                // Do not throw errors if the find operators are used with custom types.
                await connection
                    .createQueryBuilder(Post, "post")
                    .setFindOptions({
                        where: {
                            type: Equal("B"),
                        },
                        order: {
                            id: "asc",
                        },
                    })
                    .getMany()

                const posts1 = await connection
                    .createQueryBuilder(Post, "post")
                    .setFindOptions({
                        // @ts-expect-error
                        where: {
                            title: "Post #1",
                            text: null,
                        },
                        order: {
                            id: "asc",
                        },
                    })
                    .getMany()

                posts1.should.be.eql([
                    {
                        id: 1,
                        title: "Post #1",
                        text: "About post #1",
                        type: "A",
                    },
                ])

                const posts2 = await connection
                    .createQueryBuilder(Post, "post")
                    .setFindOptions({
                        // @ts-expect-error
                        where: {
                            text: null,
                        },
                        order: {
                            id: "asc",
                        },
                    })
                    .getMany()

                posts2.should.be.eql([
                    {
                        id: 1,
                        title: "Post #1",
                        text: "About post #1",
                        type: "A",
                    },
                    {
                        id: 2,
                        title: "Post #2",
                        text: "About post #2",
                        type: "B",
                    },
                ])
            }),
        ))
})
