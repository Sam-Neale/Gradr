//@ts-check

// ==== Dependancies ===
const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// ==== Express ====
const app = express(); // Create express app
const port = process.env.PORT || 3000; // Set the port as either what it set in the environment variable, or if there is none, set it to 3000
app.set("view engine", "ejs"); // Set the view engine to ejs
app.set("views", path.join(__dirname, "../views")); // Set the views directory to the views directory
app.use(express.static(path.join(__dirname, "../public"))); // Set the public directory to the public directory
app.use(express.json()) // Parse requests with JSON payloads
app.use(express.urlencoded({ extended: true })) // Parse requests with urlencoded payloads
app.use("/public", express.static(path.join(__dirname, "../public"))); // Set the public directory to the public directory (for the client side)
app.listen(port, () => console.log(`Server listening on port ${port}`)); // Start the server

// ==== Database ====
const assignmentsFolder = `${__dirname}/../data/assignments`; // Set the assignments folder to the assignments folder
const studentsFolder = `${__dirname}/../data/students`; // Set the students folder to the students folder



// ==== Routes ====
app.get("/api/*", (req, res) => {
    const path = req.path.slice(5);
    switch(path){
        case "assignments": {
                const data = [];
                fs.readdir(assignmentsFolder, (err, files) => {
                    files.forEach(file =>{
                        let assignment = JSON.parse(fs.readFileSync(`${assignmentsFolder}/${file}`).toString());
                        data.push(assignment);
                    })
                    res.json(data);
                });
            }
            break;
        case "students": {
                const data = [];
                fs.readdir(studentsFolder, (err, files) => {
                    files.forEach(file=>{
                        let student = JSON.parse(fs.readFileSync(`${studentsFolder}/${file}`).toString());
                        data.push(student);
                    })
                    res.json(data);
                });
            }
            break;
        case "allGrades": {
                //Calculate the final grade for each student, final % = (sum of ((assignment score / max score) * weighting))
                const students = new Map();
                const assignments = new Map();
                fs.readdir(studentsFolder, (err, files) => {
                    files.forEach(file => {
                        let student = JSON.parse(fs.readFileSync(`${studentsFolder}/${file}`).toString());
                        students.set(student.id, student);
                    })
                    fs.readdir(assignmentsFolder, (err, files) => {
                        files.forEach(file => {
                            let assignment = JSON.parse(fs.readFileSync(`${assignmentsFolder}/${file}`).toString());
                            assignments.set(assignment.id, assignment);
                        });

                        //Calculate the final grade for each student
                        students.forEach(student => {
                            let finalGrade = 0;
                            for(let assignment in student.grades){
                                if(student.grades[assignment] === null){
                                    student.grades[assignment] = 0;
                                }
                                finalGrade += (student.grades[assignment] / assignments.get(assignment).maxScore) * assignments.get(assignment).weighting;
                            }
                            finalGrade *= 100;
                            student.finalGrade = finalGrade;
                            student.letterGrade = finalGrade >= 85 ? "A" : finalGrade >= 75 ? "B" : finalGrade >= 55 ? "C" : finalGrade >= 45 ? "D" : finalGrade >= 30 ? "E" : "F";
                            students.set(student.id, student);
                        });
                        let submission = {};
                        students.forEach(student => {
                            submission[student.id] = student;
                        });
                        res.json(submission);
                    });
                });
            }break;
        default:
            res.sendStatus(404);
    }
});

app.post("/api/*", (req,res)=>{
    const path = req.path.slice(5);
    switch(path){
        case "assignments": {
            if(req.body.name && req.body.maxScore && req.body.description && req.body.weighting){
                //Generate random string 10 char for ID
                const id = Math.random().toString(36).substring(2, 12);
                const assignment = {
                    id,
                    name: req.body.name.toString(),
                    maxScore: parseInt(req.body.maxScore),
                    description: req.body.description.toString(),
                    weighting: parseFloat(req.body.weighting)
                }
                fs.writeFileSync(`${assignmentsFolder}/${id}.json`, JSON.stringify(assignment, null, 2));
                //Run through each of the students and add the assignment to their data (set the score to null)
                fs.readdir(studentsFolder, (err, files) => {
                    files.forEach(file=>{
                        let student = JSON.parse(fs.readFileSync(`${studentsFolder}/${file}`).toString());
                        student.grades[id] = null;
                        fs.writeFileSync(`${studentsFolder}/${file}`, JSON.stringify(student, null, 2));
                    })
                });
                if(req.query.redirect === "true"){
                    res.redirect("/assignments")
                }else{
                    res.status(200);
                    res.json(assignment);
                }
                
            }else{
                res.sendStatus(400);
            }
        }
        break;
        case "students": {
            if(req.body.name && req.body.id){
                //Check if a student with that ID already exists
                if(fs.existsSync(`${studentsFolder}/${req.body.id}.json`)){
                    res.sendStatus(409);
                }else{
                    const student = {
                        id: req.body.id.toString(),
                        name: req.body.name.toString(),
                        grades: {}
                    }
                    //Run through every assignment and assign a null score
                    fs.readdir(assignmentsFolder, (err, files) => {
                        files.forEach(file => {
                            student.grades[file.split(".")[0]] = null;
                        });
                        fs.writeFileSync(`${studentsFolder}/${req.body.id}.json`, JSON.stringify(student, null, 2));
                        if(req.query.redirect === "true"){
                            res.redirect("/students");
                        }else{
                            res.sendStatus(200);
                        };                        
                    });
                }
                
            }else{
                res.sendStatus(400);
            }
        }
        break;
        case "grade": {
            setTimeout(() => {
                if (req.body.student && req.body.assignment && req.body.grade) {
                    //Check that the student exists
                    const students = new Map();
                    fs.readdir(studentsFolder, (err, files) => {
                        files.forEach(file => {
                            let student = JSON.parse(fs.readFileSync(`${studentsFolder}/${file}`).toString());
                            students.set(student.id, student);
                        })
                        if (students.has(req.body.student)) {
                            //Check that the assignment exists
                            const assignments = new Map();
                            fs.readdir(assignmentsFolder, (err, files) => {
                                files.forEach(file => {
                                    let assignment = JSON.parse(fs.readFileSync(`${assignmentsFolder}/${file}`).toString());
                                    assignments.set(assignment.id, assignment);
                                })
                                if (assignments.has(req.body.assignment)) {
                                    //Check that the grade is a number
                                    if (!isNaN(req.body.grade)) {
                                        //Check that the grade is within the max score
                                        if (req.body.grade <= assignments.get(req.body.assignment).maxScore) {
                                            //Set the grade
                                            students.get(req.body.student).grades[req.body.assignment] = parseInt(req.body.grade);
                                            fs.writeFileSync(`${studentsFolder}/${req.body.student}.json`, JSON.stringify(students.get(req.body.student), null, 2));
                                            res.sendStatus(200);
                                        } else {
                                            res.status(400);
                                            res.send("Grade is greater than max score");
                                        }
                                    } else {
                                        res.status(400);
                                        res.send("Grade is not a number");
                                    }
                                } else {
                                    res.status(404);
                                    res.send("Assignment not found");
                                }
                            });
                        } else {
                            res.status(404);
                            res.send("Student not found");
                        }
                    });
                } else {
                    res.sendStatus(400);
                }
            }, 1000 * Math.random());
                
            }
            break;
            default:
                res.sendStatus(404);
                break;
    }
});

app.delete("/api/*", (req,res)=>{
    const path = req.path.slice(5);
    switch (path) {
        case "student": {
            if (req.body.id){
                //Check that the student exists
                const students = new Map();
                fs.readdir(studentsFolder, (err, files) => {
                    files.forEach(file => {
                        let student = JSON.parse(fs.readFileSync(`${studentsFolder}/${file}`).toString());
                        students.set(student.id, student);
                    });
                    if (students.has(req.body.id)) {
                        fs.rm(`${studentsFolder}/${req.body.id}.json`, (err) => {
                            if (err) {
                                res.sendStatus(500);
                            } else {
                                res.sendStatus(200);
                            }
                        });
                    }else{
                        res.sendStatus(404);
                    }
                });
            }else{
                res.sendStatus(400);
            }
        }break;
        case "assignment": {
            if (req.body.id) {
                //Check that the assignment exists
                const assignments = new Map();
                fs.readdir(assignmentsFolder, (err, files) => {
                    files.forEach(file => {
                        let assignment = JSON.parse(fs.readFileSync(`${assignmentsFolder}/${file}`).toString());
                        assignments.set(assignment.id, assignment);
                    });
                    if (assignments.has(req.body.id)) {
                        fs.rm(`${assignmentsFolder}/${req.body.id}.json`, (err) => {
                            if (err) {
                                
                                res.sendStatus(500);
                            } else {
                                fs.readdir(studentsFolder, (err, files) => {
                                    files.forEach(file => {
                                        let student = JSON.parse(fs.readFileSync(`${studentsFolder}/${file}`).toString());
                                        delete student.grades[req.body.id];
                                        fs.writeFileSync(`${studentsFolder}/${file}`, JSON.stringify(student, null, 2));
                                    })
                                });
                                res.sendStatus(200);
                            }
                        });
                    } else {
                        res.sendStatus(404);
                    }
                });
            } else {
                res.sendStatus(400);
            }
        } break;
    }
})

app.get("*", (req,res)=>{
    switch(req.path){
        case "/": 
        case "/students":{
            res.render("students");
        }break;
        case "/assignments": {
            //Check if the weightings of all assignments add up to 1 (100%)
            let totalWeighting = 0;
            fs.readdir(assignmentsFolder, (err, files) => {
                files.forEach(file =>{
                    const assignment = JSON.parse(fs.readFileSync(`${assignmentsFolder}/${file}`).toString());
                    totalWeighting += assignment.weighting;
                });
                res.render("assignments", {
                    totalWeighting: totalWeighting
                });
            });
        }break;
        case "/grades": {
            const students = new Map();
            const assignments = new Map();
            fs.readdir(studentsFolder, (err, files) => {
                files.forEach(file => {
                    const student = JSON.parse(fs.readFileSync(`${studentsFolder}/${file}`).toString());
                    students.set(student.id, student);
                });
                fs.readdir(assignmentsFolder, (err, files) => {
                    files.forEach(file => {
                        const assignment = JSON.parse(fs.readFileSync(`${assignmentsFolder}/${file}`).toString());
                        assignments.set(assignment.id, assignment);
                    });
                    let totalWeighting = 0;
                    fs.readdir(assignmentsFolder, (err, files) => {
                        files.forEach(file => {
                            const assignment = JSON.parse(fs.readFileSync(`${assignmentsFolder}/${file}`).toString());
                            totalWeighting += assignment.weighting;
                        });
                        res.render("grades", {
                            students, assignments, totalWeighting
                        });
                    });
                    
                });
            });            
        }break;
        case "/studentGrade":
            if(req.query.id){
                const students = new Map();
                const assignments = new Map();
                fs.readdir(studentsFolder, (err, files) => {
                    files.forEach(file => {
                        let student = JSON.parse(fs.readFileSync(`${studentsFolder}/${file}`).toString());
                        students.set(student.id, student);
                    });
                    if(students.has(req.query.id)){
                        fs.readdir(assignmentsFolder, (err, files) => {
                        files.forEach(file => {
                            let assignment = JSON.parse(fs.readFileSync(`${assignmentsFolder}/${file}`).toString());
                            assignments.set(assignment.id, assignment);
                        });

                        //Calculate the final grade for each student
                        const student = students.get(req.query.id);
                        let finalGrade = 0;
                        for (let assignment in student.grades) {
                            if (student.grades[assignment] === null) {
                                student.grades[assignment] = 0;
                            }
                            finalGrade += (student.grades[assignment] / assignments.get(assignment).maxScore) * assignments.get(assignment).weighting;
                        }
                        finalGrade *= 100;
                        student.finalGrade = finalGrade;
                        student.letterGrade = finalGrade >= 85 ? "A" : finalGrade >= 75 ? "B" : finalGrade >= 55 ? "C" : finalGrade >= 45 ? "D" : finalGrade >= 30 ? "E" : "F";
                        students.set(student.id, student);
                        let submission = {};
                        students.forEach(student => {
                            submission[student.id] = student;
                        });
                        res.status(200);
                        res.send(`Student ${student.name} (${student.id}) has a global grade of ${student.letterGrade} (${student.finalGrade}%). <a href="#" onclick='window.history.back()'>Go Back</a>`);
                    });
                    }else{
                        res.sendStatus(404);
                    }
                    
                });
            }else{
                res.sendStatus(400);
            }
            break;
        default:
            res.status(404);
            res.send("Page not found.")
    }
})