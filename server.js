import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import Users from "./dbModel.js";
import nodemailer from "nodemailer";

const app = express();
const connection_url =
  "mongodb+srv://parag:7iw5r9CBFfXHZN3@cluster0.gksxl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const PORT = process.env.PORT || 8000;

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "paragmore306@gmail.com",
    pass: "Grozanium@009",
  },
});

// middleware
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cors());

mongoose
  .connect(connection_url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(
    //listener
    app.listen(PORT, () =>
      console.log(
        `Listening @ port : ${PORT}\nSuccessfully connected to MONGO DB`
      )
    )
  )
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => res.status(200).send("Hello World"));
app.post("/register", (req, res) => {
  const userInfo = req.body;
  Users.create(userInfo, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});
const message = [];

setInterval(() => {
  Users.find((err, data) => {
    if (err) {
      console.log(err);
    } else {
      data.map(async (user) => {
        await axios
          .get(
            `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${user.district}&date=7-05-2021`
          )
          .then((res) => {
            res.data.centers.map((center) => {
              center.sessions.map((session) => {
                if (
                  session.available_capacity > 0 &&
                  session.available_capacity !== null &&
                  session.min_age_limit < 45
                ) {
                  console.log(
                    `"${session.min_age_limit}  ${session.available_capacity}   ${center.name},   @ slot ${session.date} `
                  );
                  // console.log(!user.sessionMailed.includes(session.session_id));
                  if (!user.sessionMailed.includes(session.session_id)) {
                    if (
                      !message.includes(
                        `"Your Covid Vaccines for age: ${session.min_age_limit} are available"Hello ${user.name}! \n  ${session.available_capacity} quantity of ${session.vaccine} Vaccines Available @ ${center.fee_type} fee  at ${center.name}, ${center.address}, ${center.pincode} @ slot ${session.date} for age: ${session.min_age_limit}     ${user._id}`
                      )
                    ) {
                      message.push(
                        `"Your Covid Vaccines for age: ${session.min_age_limit} are available"Hello ${user.name}! \n  ${session.available_capacity} quantity of ${session.vaccine} Vaccines Available @ ${center.fee_type} fee  at ${center.name}, ${center.address}, ${center.pincode} @ slot ${session.date} for age: ${session.min_age_limit}    ${user._id}`
                      );
                    }
                    Users.findByIdAndUpdate(
                      user._id,
                      {
                        sessionMailed: [
                          ...user.sessionMailed,
                          session.session_id,
                        ],
                      },
                      function (err, docs) {
                        if (err) {
                          console.log(err);
                        } else {
                          // console.log("Updated User : ", docs);
                        }
                      }
                    );
                  }

                  //   user.sessionMailed.map((session_id) => {
                  //     console.log(session_id);
                  //     if (session_id !== session.session_id) {
                  //       transporter.sendMail(mailOptions, function (error, info) {
                  //         if (error) {
                  //           console.log(error);
                  //         } else {
                  //           console.log("Email sent: " + info.response);

                  //         }
                  //       });
                  //     }
                  //   });
                } else {
                  // console.log("No vaccine available for < 45");
                }
              });
            });
          })
          .catch((error) => {
            console.log("api down error");
          });

        // console.log(message);

        var mailOptions = {
          from: "paragmore306@gmail.com",
          to: `${user.email}`,
          subject: `"Your Covid Vaccines for are available"`,
          text: message.toString(),
        };

        if (message.length > 0 && message !== user.message) {
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
              Users.findByIdAndUpdate(
                user._id,
                {
                  message: [...user.message, ...message],
                },
                function (err, docs) {
                  if (err) {
                    console.log(err);
                  } else {
                    // console.log("Updated User : ", docs);
                  }
                }
              );
            }
          });
        }
      });
    }
  });
}, 180000);
