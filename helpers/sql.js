const { BadRequestError } = require("../expressError");

/*
* This helper selects which values to update in sql. dataToUpdate is an object
* that represents what is being updated, jsToSql attaches js data to database column
* names. It returns an object that represents the fields that are being affected and
* the data that is being input.
*/
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
