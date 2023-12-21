import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";


const app = express();
app.use(express.json());
// All code should go below this line

//Hello World
app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

//Index endpoint
app.get("/dogs", async (req, res) => {
  const nameHas = req.query.nameHas as string;
  const dog = await prisma.dog.findMany({
    where: {
      name: {
        contains: nameHas,
      }
    }
  });

  res.send(dog);
});

// Create endpoint
app.post("/dogs", async (req, res) => {
  const { name, description, breed, age } = req.body;
  const errors: string[] = [];

  // Validate name
  if (typeof name !== "string") {
    errors.push("name should be a string");
  }

  // Validate description
  if (typeof description !== "string") {
    errors.push("description should be a string");
  }

  // Validate that age is a number
  if (age !== null && isNaN(Number(age))) {
    errors.push("age should be a number");
  }

  // Check for invalid keys
  const allowedKeys = ["name", "description", "breed", "age"];
  const receivedKeys = Object.keys(req.body);
  const invalidKeys = receivedKeys.filter((key) => !allowedKeys.includes(key));

  if (invalidKeys.length > 0) {
    res.status(400).json({ errors: [`'${invalidKeys.join("', '")}' is not a valid key`] });
    return;
  }

  // Check if there are validation errors
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  try {
    const newDog = await prisma.dog.create({
      data: {
        name,
        description,
        breed,
        age,
      },
    });

    res.status(201).json(newDog);
  } catch (error) {
    // Handle other errors (e.g., database errors)
    console.error(error);
    if ((error as Error).message.includes('age should be a number')) {
      res.status(400).json({ errors: ['age should be a number'] });
    } else {
      res.status(500).json({ errors: [(error as Error).message] });
    }
  }
});


// Show endpoint
app.get("/dogs/:id", async (req, res) => {
  const dogId = parseInt(req.params.id, 10);

  if (isNaN(dogId)) {
    return res.status(400).json({ message: "id should be a number" });
  }

  const dog = await prisma.dog.findUnique({
    where: {
      id: dogId,
    },
  });

  if (!dog) {
    return res.status(204).send();
  }

  res.json(dog);
});

// Update endpoint
app.patch("/dogs/:id", async (req, res) => {
  const dogId = parseInt(req.params.id, 10);
  const updateData = req.body;

  if (isNaN(dogId)) {
    return res.status(400).json({ message: "id should be a number" });
  }

  try {
    const updatedDog = await prisma.dog.update({
      where: {
        id: dogId,
      },
      data: updateData,
    });

    res.status(201).json(updatedDog);
  } catch (error) {
    // Handle validation errors
    res.status(400).json({ errors: "" });
  }
});

// Delete endpoint
app.delete("/dogs/:id", async (req, res) => {
  const dogId = parseInt(req.params.id, 10);

  if (isNaN(dogId)) {
    return res.status(400).json({ message: "id should be a number" });
  }

  try {
    const deletedDog = await prisma.dog.delete({
      where: {
        id: dogId,
      },
    });

    // If dog was not found, return 204
    if (!deletedDog) {
      return res.status(204).send();
    }

    res.status(200).json(deletedDog);
  } catch (error) {
    // Handle other errors (e.g., database errors)
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// all your code should go above this line
app.use(errorHandleMiddleware);

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
