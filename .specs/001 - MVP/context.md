# Objetivo
- Criar um sandbox que apresente brevemente os conceitos de HTML, CSS, JS e como eles se relacionam na programação
- Para uma apresentação interativa de até 15 minutos em uma escola 
# Proposta
## 1. Sobre o sandbox
- É um jogo de 3 fases inspirado em Bounce Tales onde o aluno cria o jogo
- A aparência deve simular uma IDE como VSC
- Em paralelo, ao lado do código um preview do resultado
- A primeira fase envolve apresentar de forma indireta o DOM com três elementos, o plano de fundo ```<sky></sky>```, o terreno ```<ground></ground>``` e o personagem ```<ball></ball>```.
## Fase 1:
- Objetivo simples de posicionar elementos e os colorir
- Eles precisam atingir o resultado esperado
### Exemplo de resultado esperado no jogo:
```html
<sky>
    <ball></ball>
    <ground></ground>
</sky>
```
e depois colorir os elementos como no exemplo:
```css
sky {
    color: blue;
}
ball {
    color: red;
}
ground {
    color: green;
}
```
## Fase 2:
- o objetivo é criar a animação de pulo da bola no CSS e depois colocar no elemento correto para testar se funciona
- sintaxe simplificada
### Exemplo de resultado esperado no jogo:
```css
ball {
    color: red;
    animation: jump
}


@animation jump {
    inicio {
        position: 0
    }
    meio {
        position: 1
    }
    fim {
        position: 0
    }
}
```
## Fase 3:
- aplicar o JS simplificado na aplicação
### Exemplo de resultado esperado no jogo:
```javascript
    if(key("D")){
        avancar()
    }
    if(key("A")){
        recuar()
    }
    if(key("space")){
        element("ball").animation("jump")
    }
```