export var swatch =
{
    props:
    [
        "color"
    ],
    methods:
    {
        draw_swatch()
        {
            var div = this.$el;
            var canvas = this.$el.querySelector("canvas");
            canvas.width = div.clientWidth;
            canvas.height = div.clientHeight;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = this.color.hex;
            ctx.fillRect(0,0,canvas.width,canvas.height);
        }
    },
    mounted()
    {
        this.draw_swatch();
    },
    updated()
    {
        this.draw_swatch();
    },
    template:/*html*/`
        <div class="swatch">
            <canvas></canvas>
        </div>`
};
