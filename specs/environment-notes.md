# Notas de ambiente

Específico desta máquina de desenvolvimento (Windows). Se migrar pra outro ambiente, revalidar tudo aqui.

## Docker está instalado mas não funciona

`docker info` trava indefinidamente. Causa raiz confirmada: **WSL2 não tem nenhuma distro instalada** (`wsl -l -v` → "Windows Subsystem for Linux has no installed distributions"). Docker Desktop nesta máquina usa backend WSL2 e não consegue subir o engine sem isso.

Não corrigido (usuário optou por não instalar WSL/reiniciar durante a sessão). Se quiser usar `docker-compose.yml` (Postgres+PostGIS em container) no futuro:

```powershell
wsl --install
# reiniciar o PC
```

Depois disso, Docker Desktop deve subir sozinho e `npm run db:up` funciona como estava originalmente planejado.

## PostgreSQL instalado nativo (caminho atual)

Como alternativa ao Docker, Postgres 17 foi instalado via winget:

```powershell
winget install --id PostgreSQL.PostgreSQL.17 -e --accept-package-agreements --accept-source-agreements --silent --override "--mode unattended --unattendedmodeui minimal --superpassword ronda_dev --serverport 5432"
```

**Pegadinha:** rodar isso de uma sessão de agente/terminal não-elevada falha com `0x800704c7` (UAC cancelado) — precisa rodar num PowerShell **como Administrador**. Depois de instalado, o serviço `postgresql-x64-17` fica de pé sozinho (start automático).

Credenciais atuais:
- Superuser: `postgres` / senha `ronda_dev`
- App role: `ronda` / senha `ronda_dev`
- Database: `ronda` (owner `ronda`)
- Porta: 5432 (padrão)

Setup do role/db (uma vez só):
```bash
PGPASSWORD=ronda_dev "/c/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -h localhost -c "CREATE ROLE ronda LOGIN PASSWORD 'ronda_dev';"
PGPASSWORD=ronda_dev "/c/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -h localhost -c "CREATE DATABASE ronda OWNER ronda;"
```

## Por que não tem PostGIS

PostGIS no Windows não tem instalador silencioso confiável (depende de Stack Builder, que é GUI interativa, ou de baixar um zip de binários específico da versão do PG que não vale o risco/tempo pra um MVP). Dado que o v0 não faz nenhuma query espacial real (`ST_DWithin`, raio, etc.) — só guarda um ponto e lê de volta — a tabela `hotspots` usa `lat`/`lng DOUBLE PRECISION` puro em vez de `GEOGRAPHY(POINT)`.

**Quando reintroduzir PostGIS:** no dia que precisar de "pontos num raio de X km" ou similar. Nesse ponto, ou resolve o WSL2 (Docker com `postgis/postgis` já está pronto em `docker-compose.yml`), ou instala PostGIS manualmente via Stack Builder na instalação nativa existente.

## Bug de CSS encontrado e corrigido nesta sessão

`apps/web/src/index.css` tinha `.hotspot-marker { position: relative; ... }`, que sobrescrevia (mesma especificidade CSS, carregado depois) o `position: absolute` que a classe `.maplibregl-marker` do MapLibre GL JS define. Efeito: cada marker ficava no fluxo normal do documento em vez de posicionado livremente, empurrando o próximo marker pra baixo — drift vertical crescente por marker (~18-20px cada), só o primeiro marker do DOM escapava. **Corrigido** removendo `position: relative` da regra (o próprio MapLibre já define `position: absolute` via classe própria, suficiente como contexto de posicionamento pros filhos `.ring`/`.core`). Verificado com teste programático (`map.project()` vs posição renderizada) em todos os 20 markers, drift zero após a correção.

Lição: cuidado com CSS custom em cima de elementos gerenciados por biblioteca externa (MapLibre, Mapbox, etc.) — especificidade igual + ordem de carregamento pode silenciosamente quebrar positioning que a lib depende.
