# Studio 57 Web System

Este é o repositório para o sistema web da Studio 57, construído com HTML, CSS, JavaScript e Firebase.

## Módulos Atuais:
- **Login:** Autenticação de usuários via Firebase Authentication.
- **Dashboard:** Página principal com navegação para os módulos do sistema.
- **Registro de Funcionários:** CRUD (Create, Read, Update, Delete) de informações de funcionários usando Firebase Firestore.
- **Registro de Empreendimentos:** (Em desenvolvimento)
- **Folha de Ponto:** (Em desenvolvimento)
- **Cronograma (Gantt):** (Em desenvolvimento)
- **Diário de Obras:** (Em desenvolvimento)
- **Recuperação de Senha:** (Em desenvolvimento)
- **Registro de Usuário:** (Em desenvolvimento)

## Tecnologias:
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend-as-a-Service (BaaS):** Google Firebase (Authentication, Firestore, Hosting)

## Como Rodar Localmente:

### Pré-requisitos:
- Node.js e npm (ou yarn) instalados.
- Firebase CLI (`npm install -g firebase-tools`).

### Configuração:
1.  Clone este repositório:
    ```bash
    git clone [https://github.com/seu-usuario/studio57.git](https://github.com/seu-usuario/studio57.git)
    cd studio57
    ```
2.  No [Firebase Console](https://console.firebase.google.com/), crie um novo projeto.
3.  Adicione um aplicativo web ao seu projeto Firebase e copie as credenciais `firebaseConfig`.
4.  Edite `public/js/firebase-config.js` e substitua os placeholders (`YOUR_API_KEY`, etc.) pelas suas credenciais reais.
5.  Inicialize o Firebase em seu diretório local (se ainda não o fez):
    ```bash
    firebase init
    ```
    Selecione `Hosting` e siga as instruções, definindo `public` como seu diretório público.
    
### Execução:
Para testar o frontend localmente, use o emulador do Firebase Hosting:
```bash
firebase serve --only hosting