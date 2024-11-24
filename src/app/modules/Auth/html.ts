export const htmlTemplate = (resetPasswordLink: string) => {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 600px;
            margin: auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #485263;
        }
        p {
            font-size: 16px;
            color: #555;
        }
        .reset-link {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            border: 1px solid black;
            font-weight: bold;
            text-align: center;
            text-decoration: none;
            border-radius: 5px;
            transition: background-color 0.3s;
        }
        .reset-link:hover {
            opacity: 0.9;
        }
        footer {
            margin-top: 30px;
            font-size: 12px;
            color: #aaa;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Password Reset Request</h1>
        <p>Hello,</p>
        <p>We received a request to reset your password. You can do this by clicking the link below:</p>
        <a href="${resetPasswordLink}" class="reset-link">Reset Your Password</a>
        <p>If you did not request a password reset, please ignore this email.</p>
        <footer>
            &copy; ${year} Nova Gb. All rights reserved.
        </footer>
    </div>
</body>
</html>


`;
};
