import re
import pandas as pd
import pyttsx3
from sklearn import preprocessing
from sklearn.tree import DecisionTreeClassifier, _tree
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_val_score
from sklearn.svm import SVC
import csv
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# Global dictionaries
severityDictionary = {}
description_list = {}
precautionDictionary = {}

# Load description data into a dictionary


def load_description_data():
    global description_list
    with open('MasterData/symptom_Description.csv') as csv_file:
        csv_reader = csv.reader(csv_file)
        for row in csv_reader:
            description_list[row[0]] = row[1]

# Load precaution data into a dictionary


def load_precaution_data():
    global precautionDictionary
    with open('MasterData/symptom_precaution.csv') as csv_file:
        csv_reader = csv.reader(csv_file)
        for row in csv_reader:
            precautionDictionary[row[0]] = row[1:]

# Load severity data into a dictionary


def load_severity_data():
    global severityDictionary
    with open('MasterData/symptom_severity.csv') as csv_file:
        csv_reader = csv.reader(csv_file)
        for row in csv_reader:
            if len(row) == 2:  # Ensure the row has exactly 2 columns
                try:
                    severityDictionary[row[0]] = int(row[1])
                except ValueError:
                    print(f"Skipping row with invalid severity value: {row}")
            else:
                print(f"Skipping malformed row: {row}")


# Load the training and testing data
training = pd.read_csv('Data/Training.csv')
testing = pd.read_csv('Data/Testing.csv')
cols = training.columns[:-1]  # List of symptoms (exclude 'prognosis' column)
x = training[cols]
y = training['prognosis']

# Reduced data for later use
reduced_data = training.groupby(training['prognosis']).max()

# Encode labels to numerical values
le = preprocessing.LabelEncoder()
le.fit(y)
y = le.transform(y)

# Split the data into training and testing sets
x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.33, random_state=42)
testx = testing[cols]
testy = testing['prognosis']
testy = le.transform(testy)

# Initialize the Decision Tree Classifier
clf1 = DecisionTreeClassifier()
clf = clf1.fit(x_train, y_train)

# Function to predict disease based on symptoms


def predict_disease(symptoms_exp):
    symptoms_dict = {symptom: index for index, symptom in enumerate(cols)}
    input_vector = np.zeros(len(symptoms_dict))

    # List of symptoms not found in the training data
    missing_symptoms = []

    for item in symptoms_exp:
        item = item.strip().lower()  # Normalize to lowercase and remove spaces
        if item in symptoms_dict:
            input_vector[symptoms_dict[item]] = 1
        else:
            missing_symptoms.append(item)

    if missing_symptoms:
        print(f"Warning: The following symptoms were not found in the training data: {
              ', '.join(missing_symptoms)}")

    prediction = clf.predict([input_vector])
    disease = le.inverse_transform(prediction)
    return disease[0]

# Route to send available symptoms (columns in the dataset)


@app.route('/get_symptoms', methods=['GET'])
def get_symptoms():
    symptoms = list(cols)  # List of symptoms (columns from the dataset)
    return jsonify({'symptoms': symptoms})

# Route to handle disease prediction and provide detailed information


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    symptoms = data.get('symptoms', [])

    # Make prediction
    predicted_disease = predict_disease(symptoms)

    # Get description and precautions
    description = description_list.get(
        predicted_disease, "No description available.")
    precautions = precautionDictionary.get(predicted_disease, [])

    return jsonify({
        'disease': predicted_disease,
        'description': description,
        'precautions': precautions  # Ensure precautions is always an array
    })

# Flask route to initiate the conversation (similar to terminal-based interactions)


@app.route('/start_conversation', methods=['POST'])
def start_conversation():
    data = request.get_json()

    name = data.get('name', '')

    # Ensure symptoms and additional_symptoms are lists before concatenating
    symptoms = data.get('symptoms', [])
    additional_symptoms = data.get('additional_symptoms', [])

    # Combine symptoms with additional symptoms, ensuring both are lists
    all_symptoms = list(symptoms) + list(additional_symptoms)

    # Make prediction and get information
    predicted_disease = predict_disease(all_symptoms)
    description = description_list.get(
        predicted_disease, "No description available.")
    precautions = precautionDictionary.get(predicted_disease, [])

    # Return disease prediction, description, and precautions
    return jsonify({
        'disease': predicted_disease,
        'description': description,
        'precautions': precautions
    })


if __name__ == '__main__':
    load_description_data()
    load_precaution_data()
    load_severity_data()
    app.run(debug=True)
