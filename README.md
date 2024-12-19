This is my senior design capstone for computer science, a project made by me and 4 others.  
I did mostly frontend work with some backend thrown in the mix.  

Other developers:  
Brady Bargren  
Benjamin Kelly  
Gabriel Perez  
Gautham Suresh  

# grp_3_aerial

## Project Description

A Small Uncrewed Aerial System (sUAS) Safety Case Tool

**Client**: Myra Cohen  
**Submitter**: Myra Cohen  
**Contact**: Myra Cohen, mcohen@iastate.edu

**Project Elements**: Significant Front-end components, Significant Back-end components, Significant algorithmic approaches  
**Technical Constraints**: Some XML and JSON. Other technologies will be taught as necessary.

In recent years, small Uncrewed Aircraft Systems (sUAS) have become increasingly used in shared airspaces for recreation, emergency services, and commercial purposes. This project aims to develop a tool that helps generate safety cases for these drones based on various input factors, such as the pilot’s training, the vehicle’s condition, and the environmental factors of the flight.

This tool will ensure that drone pilots can evaluate the safety of their flights and prepare for regulatory compliance. The tool will parse a provided XML model (representing the flight configuration) and, based on the user input, generate a safety case represented as a YAML file. This YAML file can then be used to generate a graphical safety case in formats like Goal Structuring Notation (GSN).

---

## Roles and Responsibilities

- **Brady Bargren**: *Project Manager / Backend Developer*  
  Handles the overall coordination of the project and directs the efforts of the team. Brady's main programming task is to convert the `model.xml` and the user input JSON into a YAML file for use by the drone operator. Additionally, Brady assists with the development of both the frontend and backend of the project.

- **Benjamin Kelly**: *Frontend Developer*  
  Develops the frontend using Node.js, React, and TypeScript. Benjamin's role is to create a user interface that is similar to the FAA's FRAT system, allowing users to input data that is later converted into a safety case YAML file.

- **Gabriel Perez**: *Backend Developer*  
  Focuses on the backend server, handling the parsing of `model.xml` and user input. Gabriel also routes user input to the MongoDB database and ensures the correct data flow between the frontend and backend.

- **Gautham Suresh**: *Backend Developer*  
  Works on the backend server with an emphasis on managing the MongoDB database and the generation of the JSON object from user input. Gautham's tasks also involve ensuring that data is correctly structured and stored for further use.

- **Blake Bryan**: *Frontend Developer*  
  Develops the user authentication portion of the project, focusing on implementing cookie-based authentication. Blake also assists with integrating the final safety case into the larger project once it is obtained from the client.

---

Certainly! Below are the updated **Installation and Setup** and **Running the Project** sections for your `README.md` file, including instructions for both Windows and macOS users.

---

## Installation and Setup

### Windows

1. **Install Node.js and npm**

    - Download and install Node.js from the [official website](https://nodejs.org/).
    - This will also install npm (Node Package Manager), which is required for managing project dependencies.

2. **Install MongoDB**

    - Download and install MongoDB Community Server from the [MongoDB official website](https://www.mongodb.com/try/download/community).
    - During installation, choose the **Complete** setup type.
    - Note the installation path (default is `C:\Program Files\MongoDB\Server\5.0\`).

3. **Add MongoDB to System PATH**

    - The `install.bat` script will attempt to add MongoDB to your system PATH automatically.
    - If it fails, you may need to manually add the MongoDB `bin` directory to your system PATH:
        - Open **System Properties**:
            - Press `Win + Pause/Break` or right-click on **This PC** and select **Properties**.
        - Click on **Advanced system settings**.
        - Click on **Environment Variables**.
        - Under **System variables**, scroll to **Path** and click **Edit**.
        - Click **New** and add the path to your MongoDB `bin` directory (e.g., `C:\Program Files\MongoDB\Server\5.0\bin`).
        - Click **OK** to save the changes.

4. **Run the Installer**

    - Navigate to the project directory (`grp_3_aerial`).
    - Right-click on `install.bat` and select **Run as administrator**.
        - **Note:** Running as administrator is necessary to add MongoDB to the system PATH.
    - The installer will:
        - Check for Node.js and MongoDB installations.
        - Install all necessary npm dependencies for the backend, frontend, and `gsn_suas` directories.
    - Follow any on-screen prompts and ensure all installations complete successfully.

---

### macOS

1. **Install Homebrew (if not already installed)**

    - Open Terminal and run:
      ```bash
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      ```

2. **Install Node.js and npm**

    - Using Homebrew, install Node.js:
      ```bash
      brew install node
      ```

3. **Install MongoDB**

    - Tap the MongoDB Homebrew formulae:
      ```bash
      brew tap mongodb/brew
      ```
    - Install MongoDB Community Server:
      ```bash
      brew install mongodb-community@6.0
      ```
        - Replace `6.0` with the latest version if necessary.

4. **Start MongoDB**

    - To have MongoDB start automatically now and restart at login:
      ```bash
      brew services start mongodb-community@6.0
      ```
    - Or, to run MongoDB manually each time:
      ```bash
      mongod --config /usr/local/etc/mongod.conf --fork
      ```

5. **Install Project Dependencies**

    - Open Terminal and navigate to the project directory:
      ```bash
      cd /path/to/grp_3_aerial
      ```
    - **Install Backend Dependencies**
      ```bash
      cd backend
      npm install
      ```
    - **Install Frontend Dependencies**
      ```bash
      cd ../React/src
      npm install
      ```
    - **Install gsn_suas Dependencies**
      ```bash
      cd ../../gsn_suas
      npm install
      ```

---

## Running the Project

### Windows

1. **Run the Project Script**

    - Navigate to the project directory (`grp_3_aerial`).
    - Double-click `run_project.bat` to start the project.
    - This script will:
        - Check for MongoDB and Node.js installations.
        - Ensure MongoDB data and log directories exist.
        - Start MongoDB, the backend server, and the frontend React application in separate command windows.
        - Display messages indicating the status of each component.

2. **Access the Application**

    - Open your web browser and navigate to `http://localhost:8080`.
    - You should see the sUAS Safety Case Tool interface.

---

### macOS

1. **Ensure MongoDB is Running**

    - If you chose to have MongoDB start automatically, it should already be running.
    - To check if MongoDB is running:
      ```bash
      brew services list
      ```
    - If it's not running, start it manually:
      ```bash
      brew services start mongodb-community@6.0
      ```

2. **Start the Backend Server**

    - Open a new Terminal window.
    - Navigate to the `backend` directory:
      ```bash
      cd /path/to/grp_3_aerial/backend
      ```
    - Start the server:
      ```bash
      node serverV2.js
      ```
    - You should see logs indicating the server is running and connected to MongoDB.

3. **Start the Frontend Application**

    - Open another Terminal window.
    - Navigate to the `React/src` directory:
      ```bash
      cd /path/to/grp_3_aerial/React/src
      ```
    - Start the React application:
      ```bash
      npm start
      ```
    - This will start the development server and open `http://localhost:8080` in your default web browser.

4. **Access the Application**

    - If the browser doesn't open automatically, navigate to `http://localhost:8080`.
    - You should see the sUAS Safety Case Tool interface.

---

### Additional Notes

- **Environment Variables**

    - The backend server expects a MongoDB URI from environment variables. Ensure you have a `.env` file in the `backend` directory with the following content:
      ```
      MONGO_URI=mongodb://localhost:27017/safety_case
      ```
    - On macOS, environment variables can be set using export commands or by creating a `.env` file.

- **Database Connection**

    - The application connects to a MongoDB database named `safety_case`. Ensure that the database is accessible and that your MongoDB service is running.

- **Project Structure**

    - **Backend**: Located in the `backend` directory. Handles server operations and database interactions.
    - **Frontend**: Located in `React/src`. This is the React application for the user interface.
    - **gsn_suas**: Contains scripts and templates for generating safety cases.

- **Generating Safety Cases**

    - The safety cases are generated automatically upon form submission in the application.
    - The backend will execute scripts in the `gsn_suas` directory to generate and colorize the safety case diagrams.

- **Troubleshooting**

    - If you encounter errors stating that modules cannot be found, ensure all dependencies are installed by running `npm install` in the respective directories.
    - For MongoDB connection issues, verify that the MongoDB service is running and that the connection URI is correct.
    - On Windows, if the `run_project.bat` script fails to start MongoDB, double-check that the MongoDB `bin` directory is in your system PATH.

- **NOTAMs**

    - The page on the frontend used to search for NOTAMs is currently set up to use the FAA's NOTAMs API.
    - This API requires users to request access before getting a client_id and client_secret, which must be added as headers to the GET request.

---

## Features

- **Frontend Interface**: A web-based interface allowing users to input data related to the sUAS flight.
- **Backend Logic**: Converts user input into a safety case that can be output in both XML/JSON and YAML formats.
- **MongoDB Integration**: Stores user input for future retrieval and analysis.
- **Safety Case Generation**: Creates a structured YAML file representing the safety case for the sUAS flight.

---

## Contributing

We welcome contributions! To contribute, follow these steps:

1. Fork the repository
2. Create a branch (`git checkout -b feature-branch`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add new feature'`)
5. Push to the branch (`git push origin feature-branch`)
6. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).