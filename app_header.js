export var app_header =
{
    data()
    {return{
        target:"",
        input_delta:true,
        current:[0,0,0]
    }},
    created()
    {
        this.$store.commit("set_current",{Lab:this.current,delta:this.input_delta});
    },
    computed:
    {
        colors()
        {
            return Object.keys(this.$store.state.color_map).reduce((c,id) => {c[id] = this.$store.state.colors[id]; return c;},{});
        },
        delta_visibility()
        {
            return this.input_delta ? "visibility:visible" : "visibility:hidden";
        },
        delta_L_min()
        {
            return this.input_delta ? -100 : 0;
        },
        delta_min()
        {
            return this.input_delta ? -255 : -127;
        },
        delta_max()
        {
            return this.input_delta ? 255 : 128;
        }
    },
    methods:
    {
        pick_colors(e)
        {
            this.$store.commit("load_color_file",e.target.files[0]);
        },
        use_linear(e)
        {
            this.$store.commit("set_linear",e.target.checked);
        }
    },
    watch:
    {
        async colors()
        {
            this.target = "";
            await this.$nextTick();
            this.target = Object.keys(this.colors)[0];
        },
        target()
        {
            this.$store.commit("set_target",this.target);
            this.$store.commit("set_current",{Lab:this.current,delta:this.input_delta});
        },
        current:
        {
            handler()
            {
                this.$store.commit("set_current",{Lab:this.current,delta:this.input_delta});
            },
            deep:true
        },
        input_delta()
        {
            this.$store.commit("set_current",{Lab:this.current,delta:this.input_delta});
        }
    },
    template:/*html*/`
        <div id="input-header">
            <div>
                <label for="pick-colors">Colors File</label>
                <input type="file" id="pick-colors" accept=".json" @change="pick_colors"\>
            </div>
            <form id="target-form">
                <label for="target-select">Target Color</label>
                <select id="target-select" v-model="target">
                    <option v-for="(color,id) in colors" :value="id">{{color.name}}</option>
                </select>
                <label for="use-linear">Use Linear Space</label>
                <input type="checkbox" id="use-linear" @change="use_linear" checked \>
            </form>
            <form id="current-input">
                <label for="input-deltas">Use Deltas</label>
                <input type="checkbox" id="input-deltas" v-model="input_delta" checked \>
                <label for="current-L"><span :style="delta_visibility">&Delta;</span>L</label>
                <input type="number" id="current-L" class="lab" :min="delta_L_min" max="100" step="0.01" v-model="current[0]" \>
                <label for="current-a"><span :style="delta_visibility">&Delta;</span>a</label>
                <input type="number" id="current-a" class="lab" :min="delta_min" :max="delta_max" step="0.01" v-model="current[1]" \>
                <label for="current-b"><span :style="delta_visibility">&Delta;</span>b</label>
                <input type="number" id="current-b" class="lab" :min="delta_min" :max="delta_max" step="0.01" v-model="current[2]" \>
            </form>
        </div>`
};
