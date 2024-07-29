const router = require("express").Router();
const client = require("../db");

router.post("/", (req, res) => {
  const {
    title,
    description,
    type,
    venue,
    priority,
    status,
    due_date,
    created_by,
  } = req.body;

  client.query(
    `INSERT INTO ticket (title, description, type, venue, priority, status, dueDate, createdBy) VALUES ('${title}', '${description}', '${type}', '${venue}', '${priority}', '${status}', '${due_date}', '${created_by}')`,
    (err, result) => {
      if (err) {
        console.error("Error executing query", err);
        return res.status(500).send("Error executing query");
        return;
      }
      client.query(
        `SELECT * FROM ticket WHERE title = '${title}'`,
        (err, result) => {
          if (err) {
            console.error("Error executing query", err);
            return res.status(500).send("Error executing query");
          }
          return res.send(result.rows[result.rows.length - 1]);
        }
      );
    }
  );
});

// assign ticket to users
router.post("/:ticketId/assign", (req, res) => {
  const { userId } = req.body;
  const { ticketId } = req.params;
  client.query(
    `SELECT * FROM ticket WHERE id = '${ticketId}'`,
    (err, result) => {
      if (err) {
        console.error("Error executing query", err);
        return res.status(500).send(err);
      }
      const ticket = result.rows[0];
      if (ticket.status === "closed") {
        return res.status(400).send({
          message: "Cannot assign users to a closed ticket",
        });
      }
    }
  );

  client.query(`SELECT * FROM users WHERE id = '${userId}'`, (err, result) => {
    if (err) {
      console.error("Error executing query", err);
      return res.status(500).send(err);
    }
    const user = result.rows[0];
    if (!user) {
      return res.status(400).send({
        message: "User not found",
      });
    }
  });

  client.query(
    `SELECT * FROM ticket_assignement WHERE ticketId = '${ticketId}' AND userId = '${userId}'`,
    (err, result) => {
      if (err) {
        console.error("Error executing query", err);
        return res.status(500).send(err);
      }
      if (result.rows.length > 0) {
        return res.status(400).send({
          message: "User already assigned to ticket",
        });
      }
    }
  );

  client.query(
    `INSERT INTO ticket_assignement (ticketId, userId) VALUES ('${ticketId}', '${userId}')`,
    (err, result) => {
      if (err) {
        console.error("Error executing query", err);
        res.status(500).send(err);
        return;
      }
      res.json({
        message: "User assigned successfully",
      });
    }
  );
});

router.get("/:ticketId", (req, res) => {
  // Get tickets_assignment data by id, outer join on ticket table and user table
  client.query(
    `SELECT * FROM ticket
		FULL OUTER JOIN ticket_assignement on ticket_assignement.ticketId = ticket.id
		FULL OUTER JOIN users on ticket_assignement.userId = users.id
		WHERE ticket.id = ${req.params.ticketId}
		`,
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(400).send(err);
      }
      if (result.rows == 0) {
        client.query(
          `SELECT * FROM ticket WHERE title = '${title}'`,
          (err, result) => {
            if (err) {
              console.error("Error executing query", err);
              return res.status(500).send("Error executing query");
            }

            return res.send({
              ...result.rows[0],
              users: [],
              statistics: {
                totalAssigned: 0,
                status: result.rows[0].status,
              },
            });
          }
        );
      }
      let { ticketid, userid, email, name, ...returnObj } = result.rows[0];
      let users = [];
      result.rows.forEach((row) => {
        if (row.userid) {
          users.push({
            userId: row.userid,
            name: row.name,
            email: row.email,
          });
        }
      });
      returnObj = {
        ...returnObj,
        id: req.params.ticketId,
        users: [...users],
        statistics: {
          totalAssigned: users.length,
          status: returnObj.status,
        },
      };
      res.send(returnObj);
    }
  );
});

router.get("/analytics", (req, res) => {
  let query_start = "SELECT * FROM ticket WHERE";
  for (const key in req.query) {
    query_start += ` ${key} = '${req.query[key]}' AND`;
  }
  query = query_start.substring(0, query_start.length - 4);
  console.log(query);
  client.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }
    let status = {
      open: 0,
      inProgress: 0,
      closed: 0,
    };
    let priorityDistribution = {
      low: 0,
      high: 0,
      medium: 0,
    };
    let typeDistribution = {
      concert: 0,
      conference: 0,
      sports: 0,
    };
    result.rows.forEach((row) => {
      status[row.status]++;
      priorityDistribution[row.priority]++;
      typeDistribution[row.type]++;
    });
    let returnObj = {
      totalTickets: result.rows.length,
      closedTickets: status.closed,
      openTickets: status.open,
      inProgressTickets: status.inProgress,
      priorityDistribution,
      typeDistribution,
      tickets: result.rows,
    };
    return res.send(returnObj);
  });
});

module.exports = router;
