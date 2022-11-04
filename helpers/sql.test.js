const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
    test("Updates value", function () {
        const result = sqlForPartialUpdate(
            { field1: "var1" }, { field1: "test1" }
        );
        expect(result).toEqual({
            setCols: "\"test1\"=$1",
            values: ["var1"],
        });
    });
});