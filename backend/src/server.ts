import dotenv from 'dotenv';

//load environment variable before importing other modules that might rely on them
dotenv.config();

import app from './app';
const PORT: number = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
    console.log(`Server is hearing the bullshit on port ${PORT}`);
});
