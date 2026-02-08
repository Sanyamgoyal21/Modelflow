# Modelflow

[![Deployment Status](https://img.shields.io/badge/Deployment-Live-brightgreen)](https://unsubdivided-yuriko-valval.ngrok-free.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Modelflow is a specialized "zero-configuration" platform designed to democratize AI deployment for students and independent developers.

Most machine learning models never progress beyond development notebooks because production deployment requires complex knowledge of cloud infrastructure, containerization, and scaling. Modelflow solves this by instantly converting uploaded models into production-ready APIs, automating backend containerization and orchestration without requiring any DevOps expertise from the user.

## Live Demo

Access the live application here: **[ModelFlow](https://unsubdivided-yuriko-valval.ngrok-free.dev)**

## Key Features

* **Zero-Config Deployment:** Upload a model and get a live API endpoint without setting up servers or writing Dockerfiles.
* **Automated Infrastructure:** Automatically handles container building (Docker), orchestration, and reverse proxying.
* **Auto-Scaling:** Utilizes AWS Auto Scaling Groups (ASG) and Application Load Balancers (ALB) to handle traffic dynamically.
* **Secure Access:** Integrated Google OAuth for authentication and controlled endpoint exposure.
* **Developer Dashboard:** A unified interface to manage models, view API details, and monitor deployment status.

## Architecture & Workflow

Modelflow operates on a robust pipeline that bridges the gap between static model files and dynamic cloud services:

1.  **User Upload:** The user uploads a model via the React.js web interface.
2.  **Validation:** The system validates the model format and dependencies.
3.  **Containerization:** The backend triggers a Docker build process to package the model.
4.  **Deployment:** The container is pushed to a registry and deployed to AWS EC2 instances.
5.  **Inference:** The API is exposed via Nginx and NGROK for immediate public access.

## Tech Stack

### Frontend & Backend
* **MERN Stack:** MongoDB, Express.js, React.js, Node.js.
* **Authentication:** Google OAuth.

### Machine Learning & DevOps
* **Inference Engine:** Python.
* **Containerization:** Docker.
* **Networking:** Nginx (Reverse Proxy), NGROK (Tunneling).

### Cloud Infrastructure (AWS)
* **Compute:** Amazon EC2.
* **Scaling:** Auto Scaling Groups (ASG).
* **Load Balancing:** Application Load Balancer (ALB).

## Installation & Setup

Follow these steps to set up the project locally for development.

### Prerequisites
* Node.js & npm
* Python 3.x
* MongoDB
* Docker Desktop (for containerization features)
* AWS Account (for cloud deployment features)

### Steps to Run

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Sanyamgoyal21/Modelflow.git
    cd Modelflow
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd server
    npm install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd client
    npm install
    ```

4.  **Configure Environment Variables**
    Create a `.env` file in the root/server directory with your credentials:
    ```env
    MONGO_URI=your_mongodb_uri
    GOOGLE_CLIENT_ID=your_google_client_id
    AWS_ACCESS_KEY_ID=your_aws_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret
    ```

5.  **Run the Application**
    * Start the backend:
        ```bash
        npm start
        ```
    * Start the frontend:
        ```bash
        cd client
        npm start
        ```

## Team: Code Blooded

Developed by students from **UPES**:

* **Dhairya Thareja**
* **Sanyam Goyal**
* **Aman Jain**
* **Aksh Chauhan**

## License

This project is open-source and available under the MIT License.