import * as proj from "projections"
import {vec3} from "glMatrix"

export var ratios =
{
    data()
    {return{
        fix1:0
    }},
    computed:
    {
        target()
        {
            return this.$store.state.target_color;
        },
        current()
        {
            return this.$store.state.current_color;
        },
        comp_colors()
        {
            return this.$store.state.comp_colors;
        },
        comp_colors_select()
        {
            return this.$store.state.comp_colors.map((col,idx) => {return {"value":idx,"title":col.name}});
        },
        comp_ratios()
        {
            let moving_comps = this.comp_colors.filter((_,c)=>c!=this.fix1);
            let moving_comp_vecs = moving_comps.map((c)=>c.XYZ);
            let current = this.current.XYZ;
            let target = this.target.XYZ;
            if(moving_comp_vecs.length == 2)
            {
                target = proj.project_onto_plane(target,...moving_comp_vecs,current);
            }
            let bary = proj.barycentric_hull(target,[...moving_comp_vecs,current]);
            let mult = 0;
            for(let b in bary)
            {
                if(bary[b] != 0)
                {
                    if(mult == 0)
                    {
                        mult = Math.abs(1/bary[b]);
                    }
                    bary[b] *= mult;
                }
            }
            return Array.from(bary).slice(0,-1).map((b,i)=>{return {'color':moving_comps[i],'ratio':b};});
        },
        target_direction()
        {
            let d = vec3.create();
            vec3.sub(d,this.target.XYZ,this.current.XYZ);
            vec3.normalize(d,d);
            return d;
        },
        ratio_direction()
        {
            let p = vec3.create();
            for(let c of this.comp_ratios)
            {
                let part = vec3.clone(c.color.XYZ);
                vec3.sub(part,part,this.current.XYZ);
                vec3.normalize(part,part);
                vec3.scale(part,part,c.ratio);
                vec3.add(p,p,part);
            }
            vec3.normalize(p,p);
            return p;
        },
        theta()
        {
            return vec3.angle(this.target_direction,this.ratio_direction);
        },
        delta()
        {
            return vec3.distance(this.current.XYZ,this.target.XYZ);
        }
    },
    methods:
    {
        barycentric_coords(p,h)
        {
            return proj.barycentric_hull_bounded(p.XYZ,h.map((c)=>c.XYZ));
        }
    },
    watch:
    {
        comp_colors()
        {
            this.fix1 = 0;
        }
    },
    template:/*html*/`
        <div class="mx-auto mt-10 mb-4 d-flex flex-wrap justify-center ga-4" :style="{'max-width':'85dvw'}">
            <v-card elevation="10">
                <v-card-title>Move Components by Ratio</v-card-title>
                <v-card-subtitle>One Component Stays Fixed</v-card-subtitle>
                <v-card-text v-if="comp_colors.length >= 3" class="d-flex flex-column justify-center">
                    <v-select :style="{'min-width':'14em'}" density="compact" label="Fixed Component" :items="comp_colors_select" v-model="fix1"></v-select>
                    <v-table><tbody>
                        <tr v-for="comp in comp_ratios">
                            <td>{{comp.color.name}}</td>
                            <td colspan="3">{{comp.ratio.toFixed(4)}}</td>
                        </tr>
                        <tr>
                            <td>Target Direction</td>
                            <td>{{target_direction[0].toFixed(2)}}</td>
                            <td>{{target_direction[1].toFixed(2)}}</td>
                            <td>{{target_direction[2].toFixed(2)}}</td>
                        </tr>
                        <tr>
                            <td>Ratio Direction</td>
                            <td>{{ratio_direction[0].toFixed(2)}}</td>
                            <td>{{ratio_direction[1].toFixed(2)}}</td>
                            <td>{{ratio_direction[2].toFixed(2)}}</td>
                        </tr>
                        <tr>
                            <td>&Theta;</td>
                            <td colspan="3">{{theta.toFixed(4)}}</td>
                        </tr>
                        <tr>
                            <td>|&Delta;|</td>
                            <td colspan="3">{{delta.toFixed(4)}}</td>
                        </tr>
                    </tbody></v-table>
                </v-card-text>
                <v-card-text v-else>
                    Not Enough Components to Work With
                </v-card-text>
            </v-card>
        </div>`
};
