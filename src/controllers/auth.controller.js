const prisma = require("../services/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Register

const register = async (req, res) => {
  try {
    const { name, email, password, slug } = req.body;

    //Check if slug is already taken
    const existingStore = await prisma.store.findUnique({
      where: { slug },
    });
    if (existingStore) {
      return res.status(400).json({ message: "Slug is already taken" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const store = await prisma.store.create({
      data: {
        name,
        slug,
        users: {
          create: {
            email,
            password: password_hash ,
            role: "ADMIN",
          },
        },
      },
      include: {
        users: true,
      },
    });
    const createdUser = store.users[0];
    const token = jwt.sign(
      { userId: createdUser.id, storeId: store.id, role: createdUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.status(201).json({ token , store: { id: store.id, name: store.name, slug: store.slug } });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


//login

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return res.status(404).json({ message: "user not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { userId: user.id, storeId: user.storeId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login };