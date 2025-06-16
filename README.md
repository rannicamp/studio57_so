Studio 57 Web System
Este é o repositório para o sistema web da Studio 57, construído com HTML, CSS, JavaScript e Supabase.

Módulos Atuais:
Login: Autenticação de usuários via Supabase Authentication.

Dashboard: Página principal com navegação para os módulos do sistema.

Registro de Funcionários: CRUD (Create, Read, Update, Delete) de informações de funcionários usando Supabase.

Registro de Empreendimentos: (Em desenvolvimento)

Folha de Ponto: (Em desenvolvimento)

Cronograma (Gantt): (Em desenvolvimento)

Diário de Obras: (Em desenvolvimento)

Recuperação de Senha: (Em desenvolvimento)

Registro de Usuário: (Em desenvolvimento)

Tecnologias:
Frontend: HTML5, CSS3, JavaScript (ES6+)

Backend-as-a-Service (BaaS): Supabase (Authentication, Database, Storage)

Como Rodar Localmente:
Pré-requisitos:
Node.js e npm (ou yarn) instalados.

Uma conta e projeto Supabase configurados.

Configuração:
Clone este repositório:

git clone [https://github.com/seu-usuario/studio57.git](https://github.com/seu-usuario/studio57.git)
cd studio57

No Supabase Dashboard, crie um novo projeto.

Obtenha suas credenciais (URL e anon key) em "Project Settings" > "API".

Verifique se o arquivo public/js/supabase-config.js está corretamente configurado com suas credenciais do Supabase.

Execução:
Para testar o frontend localmente, você pode usar um servidor web simples. Se você tem o Node.js instalado, pode usar o serve:

npx serve public/

Isso iniciará um servidor local que hospeda seus arquivos da pasta public.