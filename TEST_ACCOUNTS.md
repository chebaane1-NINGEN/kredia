# 📋 TEST USER ACCOUNTS FOR KREDIA WEB APPLICATION

## 🔑 LOGIN CREDENTIALS

### 👑 ADMIN ACCOUNTS (5)
| Full Name | Email | Password | Role |
|-----------|-------|----------|------|
| Jean-Marc Dubois | jean-marc.dubois@kredia-admin.com | Test1234 | ADMIN |
| Marie Laurent | marie.laurent@kredia-admin.com | Test1234 | ADMIN |
| Pierre Bernard | pierre.bernard@kredia-admin.com | Test1234 | ADMIN |
| Sophie Martin | sophie.martin@kredia-admin.com | Test1234 | ADMIN |
| Thomas Petit | thomas.petit@kredia-admin.com | Test1234 | ADMIN |

### 🤵 AGENT ACCOUNTS (5)
| Full Name | Email | Password | Role |
|-----------|-------|----------|------|
| Isabelle Rodriguez | isabelle.rodriguez@kredia-agent.com | Test1234 | AGENT |
| Nicolas Chen | nicolas.chen@kredia-agent.com | Test1234 | AGENT |
| Camille Silva | camille.silva@kredia-agent.com | Test1234 | AGENT |
| François Kumar | francois.kumar@kredia-agent.com | Test1234 | AGENT |
| Élodie Wang | elodie.wang@kredia-agent.com | Test1234 | AGENT |

### 👤 CLIENT ACCOUNTS (10)
| Full Name | Email | Password | Role |
|-----------|-------|----------|------|
| Alexandre Tremblay | alexandre.tremblay@kredia-client.com | Test1234 | CLIENT |
| Julie Gauthier | julie.gauthier@kredia-client.com | Test1234 | CLIENT |
| Michel Robert | michel.robert@kredia-client.com | Test1234 | CLIENT |
| Louise Bouchard | louise.bouchard@kredia-client.com | Test1234 | CLIENT |
| Philippe Morin | philippe.morin@kredia-client.com | Test1234 | CLIENT |
| Anne Lévesque | anne.levesque@kredia-client.com | Test1234 | CLIENT |
| David Gagnon | david.gagnon@kredia-client.com | Test1234 | CLIENT |
| Marie-Claude Roy | marie-claude.roy@kredia-client.com | Test1234 | CLIENT |
| Stéphane Bélanger | stephane.belanger@kredia-client.com | Test1234 | CLIENT |
| Catherine Lambert | catherine.lambert@kredia-client.com | Test1234 | CLIENT |

---

## 📊 SUMMARY
- **Total Accounts**: 20
- **Admin Accounts**: 5
- **Agent Accounts**: 5  
- **Client Accounts**: 10
- **Default Password**: Test1234
- **Email Format**: {name}@{role}-domain.com

## 🎯 TESTING SCENARIOS

### 1. Admin Testing
- **URL**: `http://localhost:5174/login`
- **Use any admin account** above
- **Expected Redirect**: `/admin` dashboard

### 2. Agent Testing  
- **URL**: `http://localhost:5174/login`
- **Use any agent account** above
- **Expected Redirect**: `/agent` dashboard

### 3. Client Testing
- **URL**: `http://localhost:5174/login`
- **Use any client account** above
- **Expected Redirect**: `/client` dashboard

### 4. Registration Testing
- **URL**: `http://localhost:5174/register`
- **New accounts will be CLIENT role by default**

---

## 🔐 SECURITY NOTES
- All passwords are simple: `Test1234`
- Emails use realistic French/Quebec names
- Email domains are organized by role for easy identification
- All emails are unique and valid format
- Ready for immediate testing

## 📁 FILES CREATED
- `test_accounts.json` - Machine-readable format
- `TEST_ACCOUNTS.md` - This human-readable format

Ready for testing! 🚀
