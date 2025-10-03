from flask import Flask, request, jsonify


app = Flask(__name__)

@app.route("/test")
def test():
    return {"message": "Server running"}



@app.route('/signup', methods=['POST'])
def Signup():
    data = request.get_json()
    return jsonify({"message": "Signup route working!", "data": data})

if __name__ == '__main__':
    app.run(port=5000, debug=True)