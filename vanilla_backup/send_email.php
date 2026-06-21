<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nome = strip_tags(trim($_POST["nome"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $mensagem = strip_tags(trim($_POST["mensagem"]));

    if (empty($nome) || !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($mensagem)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Por favor, preencha todos os campos corretamente."]);
        exit;
    }

    $destinatario = "comercial@mentesqueinspiram.com";
    $assunto = "Nova Proposta: $nome — Mentes que Inspiram";

    $corpo_email  = "Olá Vanessa,\n\n";
    $corpo_email .= "Uma nova proposta foi enviada pelo site:\n\n";
    $corpo_email .= "Nome: $nome\n";
    $corpo_email .= "Email: $email\n\n";
    $corpo_email .= "Mensagem:\n$mensagem\n\n";
    $corpo_email .= "---\nEnviado via mentesqueinspiram.com";

    $cabecalhos  = "From: Site Mentes que Inspiram <noreply@mentesqueinspiram.com>\r\n";
    $cabecalhos .= "Reply-To: $nome <$email>\r\n";
    $cabecalhos .= "X-Mailer: PHP/" . phpversion();

    if (mail($destinatario, $assunto, $corpo_email, $cabecalhos)) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Proposta enviada com sucesso!"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Ocorreu um erro ao enviar. Tente novamente."]);
    }
} else {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Método não permitido."]);
}
?>
